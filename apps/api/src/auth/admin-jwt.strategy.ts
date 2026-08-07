import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AdminUser } from './admin-auth.service';

type AdminJwtPayload = {
  sub: string;
  email: string;
  name: string;
  picture?: string | null;
  typ?: string;
};

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'reine-univers-dev-secret',
    });
  }

  validate(payload: AdminJwtPayload): AdminUser {
    if (payload.typ !== 'admin' || !payload.email) {
      throw new UnauthorizedException('Jeton admin invalide');
    }
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name || payload.email,
      picture: payload.picture ?? null,
      typ: 'admin',
    };
  }
}
