import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AdminAuthService } from './admin-auth.service';
import {
  BootstrapAdminLoginDto,
  GoogleAdminLoginDto,
  PasswordAdminLoginDto,
} from './dto/admin-auth.dto';
import { AdminJwtAuthGuard } from './admin-jwt-auth.guard';
import type { AdminUser } from './admin-auth.service';

@Controller('auth/admin')
export class AdminAuthController {
  constructor(private readonly adminAuth: AdminAuthService) {}

  @Get('status')
  status() {
    return this.adminAuth.status();
  }

  /** Connexion manuelle email/username + mot de passe */
  @Post('login')
  loginPassword(@Body() dto: PasswordAdminLoginDto) {
    return this.adminAuth.loginWithPassword(dto.identifier, dto.password);
  }

  /** Google Identity Services — ID token from frontend button */
  @Post('google')
  googleIdToken(@Body() dto: GoogleAdminLoginDto) {
    return this.adminAuth.loginWithGoogleIdToken(dto.credential);
  }

  /** OAuth redirect start (Google portal) */
  @Get('google/start')
  @UseGuards(AuthGuard('google-admin'))
  googleStart() {
    // Passport redirects to Google
  }

  /** OAuth callback → redirect to Nuxt with token */
  @Get('google/callback')
  @UseGuards(AuthGuard('google-admin'))
  googleCallback(
    @Req() req: { user: { accessToken: string } },
    @Res() res: Response,
  ) {
    const web =
      process.env.ADMIN_WEB_URL?.trim() ||
      process.env.CORS_ORIGIN?.split(',')[0]?.trim() ||
      'http://127.0.0.1:3000';
    const token = req.user.accessToken;
    return res.redirect(
      `${web.replace(/\/$/, '')}/admin/connexion?token=${encodeURIComponent(token)}`,
    );
  }

  /** Local bootstrap when Google OAuth not ready */
  @Post('bootstrap')
  bootstrap(@Body() dto: BootstrapAdminLoginDto) {
    return this.adminAuth.loginBootstrap(dto.email, dto.secret);
  }

  @UseGuards(AdminJwtAuthGuard)
  @Get('me')
  me(@Req() req: { user: AdminUser }) {
    return this.adminAuth.meFromUser(req.user);
  }
}
