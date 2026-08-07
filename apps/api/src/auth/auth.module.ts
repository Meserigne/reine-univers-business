import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { AdminAuthService } from './admin-auth.service';
import { AdminAuthController } from './admin-auth.controller';
import { AdminJwtStrategy } from './admin-jwt.strategy';
import { GoogleAdminStrategy } from './google-admin.strategy';
import { AdminJwtAuthGuard } from './admin-jwt-auth.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'reine-univers-dev-secret',
      signOptions: { expiresIn: '30d' },
    }),
  ],
  controllers: [AuthController, AdminAuthController],
  providers: [
    AuthService,
    JwtStrategy,
    AdminAuthService,
    AdminJwtStrategy,
    GoogleAdminStrategy,
    AdminJwtAuthGuard,
  ],
  exports: [AuthService, JwtModule, AdminAuthService, AdminJwtAuthGuard],
})
export class AuthModule {}
