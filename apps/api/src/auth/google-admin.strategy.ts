import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, type Profile, type VerifyCallback } from 'passport-google-oauth20';
import { AdminAuthService } from './admin-auth.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class GoogleAdminStrategy extends PassportStrategy(
  Strategy,
  'google-admin',
) {
  constructor(
    private readonly adminAuth: AdminAuthService,
    private readonly jwt: JwtService,
  ) {
    const clientID = process.env.GOOGLE_CLIENT_ID?.trim() || 'unused';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() || 'unused';
    const callbackURL =
      process.env.GOOGLE_ADMIN_CALLBACK_URL?.trim() ||
      'http://localhost:3001/auth/admin/google/callback';

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    try {
      const clientId = await this.adminAuth.resolveGoogleClientId();
      if (!clientId) {
        return done(
          new UnauthorizedException('Google OAuth non configuré'),
          undefined,
        );
      }
      const email = profile.emails?.[0]?.value;
      if (!email) {
        return done(
          new UnauthorizedException('Email Google introuvable'),
          undefined,
        );
      }

      const allowed = await this.adminAuth.getAllowedEmails();
      if (!allowed.includes(email.toLowerCase())) {
        return done(
          new UnauthorizedException(
            'Ce compte Google n’est pas autorisé à accéder à l’admin.',
          ),
          undefined,
        );
      }

      const admin = {
        id: profile.id,
        email: email.toLowerCase(),
        name: profile.displayName || email,
        picture: profile.photos?.[0]?.value || null,
        typ: 'admin' as const,
      };

      const accessToken = await this.jwt.signAsync(
        {
          sub: admin.id,
          email: admin.email,
          name: admin.name,
          picture: admin.picture,
          typ: 'admin',
        },
        { expiresIn: '7d' },
      );

      return done(null, { accessToken, admin });
    } catch (err) {
      return done(err as Error, undefined);
    }
  }
}
