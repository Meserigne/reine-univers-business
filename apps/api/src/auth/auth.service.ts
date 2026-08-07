import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { POINT_VALUE_FCFA } from '../loyalty/loyalty.constants';
import { LoginDto, RegisterDto, UpdateProfileDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const phone = this.normalizePhone(dto.phone);
    const existing = await this.prisma.customer.findUnique({ where: { phone } });
    if (existing) {
      throw new ConflictException('Un compte existe déjà avec ce téléphone');
    }
    if (dto.email) {
      const emailTaken = await this.prisma.customer.findUnique({
        where: { email: dto.email.toLowerCase() },
      });
      if (emailTaken) {
        throw new ConflictException('Cet email est déjà utilisé');
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const customer = await this.prisma.customer.create({
      data: {
        name: dto.name.trim(),
        phone,
        email: dto.email?.toLowerCase() || null,
        address: dto.address?.trim() || null,
        passwordHash,
      },
    });

    // Ensure loyalty account exists for this phone
    await this.prisma.loyaltyAccount.upsert({
      where: { phone },
      create: { phone, points: 0 },
      update: {},
    });

    return this.authResponse(customer);
  }

  async login(dto: LoginDto) {
    const phone = this.normalizePhone(dto.phone);
    const customer = await this.prisma.customer.findUnique({ where: { phone } });
    if (!customer || !customer.active) {
      throw new UnauthorizedException('Téléphone ou mot de passe incorrect');
    }
    const ok = await bcrypt.compare(dto.password, customer.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Téléphone ou mot de passe incorrect');
    }
    return this.authResponse(customer);
  }

  async me(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer || !customer.active) {
      throw new NotFoundException('Compte introuvable');
    }
    const loyalty = await this.prisma.loyaltyAccount.findUnique({
      where: { phone: customer.phone },
    });
    const orderCount = await this.prisma.order.count({
      where: {
        OR: [{ customerId: customer.id }, { phone: customer.phone }],
      },
    });
    const points = loyalty?.points ?? 0;
    return {
      ...this.publicCustomer(customer),
      points,
      pointValue: POINT_VALUE_FCFA,
      pointsValueFcfa: points * POINT_VALUE_FCFA,
      orderCount,
    };
  }

  async updateProfile(customerId: string, dto: UpdateProfileDto) {
    const data: {
      name?: string;
      email?: string | null;
      address?: string | null;
      passwordHash?: string;
    } = {};
    if (dto.name) data.name = dto.name.trim();
    if (dto.address !== undefined) data.address = dto.address?.trim() || null;
    if (dto.email !== undefined) {
      const email = dto.email?.toLowerCase() || null;
      if (email) {
        const taken = await this.prisma.customer.findFirst({
          where: { email, NOT: { id: customerId } },
        });
        if (taken) throw new ConflictException('Cet email est déjà utilisé');
      }
      data.email = email;
    }
    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    const customer = await this.prisma.customer.update({
      where: { id: customerId },
      data,
    });
    return this.publicCustomer(customer);
  }

  async myOrders(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) throw new NotFoundException('Compte introuvable');

    return this.prisma.order.findMany({
      where: {
        OR: [{ customerId }, { phone: customer.phone }],
      },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  listCustomers() {
    return this.prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        address: true,
        active: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    });
  }

  private authResponse(customer: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    address: string | null;
    createdAt: Date;
  }) {
    const accessToken = this.jwt.sign({
      sub: customer.id,
      phone: customer.phone,
      name: customer.name,
    });
    return {
      accessToken,
      customer: this.publicCustomer(customer),
    };
  }

  private publicCustomer(customer: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    address: string | null;
    createdAt: Date;
  }) {
    return {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      createdAt: customer.createdAt,
    };
  }

  private normalizePhone(phone: string) {
    return phone.replace(/\s+/g, '').trim();
  }
}
