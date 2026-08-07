import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AdminJwtAuthGuard extends AuthGuard('admin-jwt') {
  handleRequest<TUser>(err: Error | null, user: TUser): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException('Connexion admin requise');
    }
    return user;
  }
}

/** Soft guard for optional admin (rarely needed) */
@Injectable()
export class OptionalAdminJwtAuthGuard extends AuthGuard('admin-jwt') {
  canActivate(context: ExecutionContext) {
    const result = super.canActivate(context);
    if (result instanceof Promise) {
      return result.catch(() => true);
    }
    return result;
  }

  handleRequest<TUser>(_err: Error | null, user: TUser): TUser {
    return user;
  }
}
