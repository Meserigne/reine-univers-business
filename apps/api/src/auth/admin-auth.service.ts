import {
  BadRequestException,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  picture?: string | null;
  typ: 'admin';
};

@Injectable()
export class AdminAuthService implements OnModuleInit {
  private googleClient: OAuth2Client | null = null;
  private googleClientIdCached = '';

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    await this.ensureDefaultAdmin();
    await this.getAuthSettings();
  }

  async getAuthSettings() {
    return this.prisma.adminAuthSettings.upsert({
      where: { id: 'main' },
      create: { id: 'main' },
      update: {},
    });
  }

  async updateAuthSettings(data: {
    googleClientId?: string;
    googleClientSecret?: string;
    googleAllowedEmails?: string;
  }) {
    await this.getAuthSettings();
    const updated = await this.prisma.adminAuthSettings.update({
      where: { id: 'main' },
      data: {
        googleClientId: data.googleClientId?.trim() ?? undefined,
        googleClientSecret: data.googleClientSecret?.trim() ?? undefined,
        googleAllowedEmails: data.googleAllowedEmails?.trim() ?? undefined,
      },
    });
    this.googleClient = null;
    this.googleClientIdCached = '';
    return {
      id: updated.id,
      googleClientId: updated.googleClientId,
      googleAllowedEmails: updated.googleAllowedEmails,
      // never expose full secret
      googleClientSecretSet: Boolean(updated.googleClientSecret),
      updatedAt: updated.updatedAt,
    };
  }

  /** Create default admin from env if none exists */
  async ensureDefaultAdmin() {
    const count = await this.prisma.adminAccount.count();
    if (count > 0) return;

    const email = (
      process.env.ADMIN_EMAIL || 'admin@reineunivers.sn'
    ).toLowerCase();
    const username = (process.env.ADMIN_USERNAME || 'admin').toLowerCase();
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const name = process.env.ADMIN_NAME || 'Administrateur';

    const passwordHash = await bcrypt.hash(password, 10);
    await this.prisma.adminAccount.create({
      data: { email, username, name, passwordHash, active: true },
    });
  }

  async resolveGoogleClientId() {
    const settings = await this.getAuthSettings();
    return (
      settings.googleClientId?.trim() ||
      process.env.GOOGLE_CLIENT_ID?.trim() ||
      ''
    );
  }

  async resolveGoogleClientSecret() {
    const settings = await this.getAuthSettings();
    return (
      settings.googleClientSecret?.trim() ||
      process.env.GOOGLE_CLIENT_SECRET?.trim() ||
      ''
    );
  }

  async getAllowedEmails(): Promise<string[]> {
    const settings = await this.getAuthSettings();
    const fromDb = (settings.googleAllowedEmails || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const fromEnv = (process.env.ADMIN_GOOGLE_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const fromAccounts = (
      await this.prisma.adminAccount.findMany({
        where: { active: true },
        select: { email: true },
      })
    ).map((a) => a.email.toLowerCase());
    return [...new Set([...fromDb, ...fromEnv, ...fromAccounts])];
  }

  async status() {
    const clientId = await this.resolveGoogleClientId();
    const emails = await this.getAllowedEmails();
    const passwordAccounts = await this.prisma.adminAccount.count({
      where: { active: true },
    });
    return {
      // Always advertise Google on the login page
      googleEnabled: true,
      googleConfigured: Boolean(clientId),
      clientId: clientId || null,
      allowlistConfigured: emails.length > 0,
      allowlistCount: emails.length,
      passwordLoginEnabled: passwordAccounts > 0,
    };
  }

  private async assertAllowed(email: string) {
    const allowed = await this.getAllowedEmails();
    if (!allowed.length) {
      // First Google login: allow if matches any admin account email, else reject
      throw new UnauthorizedException(
        'Aucun email Google autorisé. Ajoutez-le dans Admin → Comptes, ou créez un compte admin avec cet email.',
      );
    }
    if (!allowed.includes(email.toLowerCase())) {
      throw new UnauthorizedException(
        'Ce compte Google n’est pas autorisé. Ajoutez cet email dans Admin → Comptes.',
      );
    }
  }

  private async getClient() {
    const clientId = await this.resolveGoogleClientId();
    if (!clientId) {
      throw new UnauthorizedException(
        'Google Sign-In non configuré. Renseignez le Client ID dans Admin → Comptes.',
      );
    }
    if (!this.googleClient || this.googleClientIdCached !== clientId) {
      this.googleClient = new OAuth2Client(clientId);
      this.googleClientIdCached = clientId;
    }
    return { client: this.googleClient, clientId };
  }

  private async signAdmin(admin: AdminUser) {
    const accessToken = await this.jwt.signAsync(
      {
        sub: admin.id,
        email: admin.email,
        name: admin.name,
        picture: admin.picture ?? null,
        typ: 'admin',
      },
      { expiresIn: '7d' },
    );
    return { accessToken, admin };
  }

  async loginWithPassword(identifier: string, password: string) {
    const login = identifier.trim().toLowerCase();
    if (!login || !password) {
      throw new UnauthorizedException('Identifiant ou mot de passe requis');
    }

    const account = await this.prisma.adminAccount.findFirst({
      where: {
        active: true,
        OR: [{ email: login }, { username: login }],
      },
    });

    if (!account) {
      throw new UnauthorizedException('Identifiant ou mot de passe incorrect');
    }

    const ok = await bcrypt.compare(password, account.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Identifiant ou mot de passe incorrect');
    }

    return this.signAdmin({
      id: account.id,
      email: account.email,
      name: account.name,
      picture: null,
      typ: 'admin',
    });
  }

  async loginWithGoogleIdToken(idToken: string) {
    const { client, clientId } = await this.getClient();
    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId,
    });
    const payload = ticket.getPayload();
    if (!payload?.email || !payload.email_verified) {
      throw new UnauthorizedException('Compte Google non vérifié');
    }

    await this.assertAllowed(payload.email);

    return this.signAdmin({
      id: payload.sub,
      email: payload.email.toLowerCase(),
      name: payload.name || payload.email,
      picture: payload.picture || null,
      typ: 'admin',
    });
  }

  async loginBootstrap(email: string, secret: string) {
    const expected = process.env.ADMIN_BOOTSTRAP_SECRET?.trim();
    if (!expected || secret !== expected) {
      throw new UnauthorizedException('Identifiants bootstrap invalides');
    }
    const normalized = email.trim().toLowerCase();
    const allowed = await this.getAllowedEmails();
    if (allowed.length > 0 && !allowed.includes(normalized)) {
      await this.assertAllowed(normalized);
    }
    return this.signAdmin({
      id: `bootstrap:${normalized}`,
      email: normalized,
      name: normalized.split('@')[0],
      picture: null,
      typ: 'admin',
    });
  }

  meFromUser(user: AdminUser) {
    return user;
  }

  // —— Admin accounts CRUD ——
  listAccounts() {
    return this.prisma.adminAccount.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async createAccount(data: {
    email: string;
    username: string;
    name: string;
    password: string;
  }) {
    const email = data.email.trim().toLowerCase();
    const username = data.username.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(data.password, 10);
    return this.prisma.adminAccount.create({
      data: {
        email,
        username,
        name: data.name.trim(),
        passwordHash,
        active: true,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        active: true,
        createdAt: true,
      },
    });
  }

  async updateAccount(
    id: string,
    data: {
      email?: string;
      username?: string;
      name?: string;
      password?: string;
      active?: boolean;
    },
  ) {
    const patch: Record<string, unknown> = {};
    if (data.email) patch.email = data.email.trim().toLowerCase();
    if (data.username) patch.username = data.username.trim().toLowerCase();
    if (data.name) patch.name = data.name.trim();
    if (typeof data.active === 'boolean') patch.active = data.active;
    if (data.password) patch.passwordHash = await bcrypt.hash(data.password, 10);
    return this.prisma.adminAccount.update({
      where: { id },
      data: patch,
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        active: true,
        updatedAt: true,
      },
    });
  }

  async deleteAccount(id: string) {
    const count = await this.prisma.adminAccount.count();
    if (count <= 1) {
      throw new BadRequestException(
        'Impossible de supprimer le dernier compte admin',
      );
    }
    await this.prisma.adminAccount.delete({ where: { id } });
    return { ok: true };
  }

  async getAuthSettingsPublic() {
    const s = await this.getAuthSettings();
    return {
      googleClientId: s.googleClientId,
      googleAllowedEmails: s.googleAllowedEmails,
      googleClientSecretSet: Boolean(s.googleClientSecret),
    };
  }
}
