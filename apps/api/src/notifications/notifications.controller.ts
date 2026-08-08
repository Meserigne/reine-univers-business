import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminJwtAuthGuard } from '../auth/admin-jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller()
export class NotificationsController {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  /** Client connecté — notifications in-app (apps mobiles / compte web) */
  @UseGuards(JwtAuthGuard)
  @Get('notifications/me')
  myNotifications(@Req() req: { user: { id: string } }) {
    return this.notifications.listForCustomer(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('notifications/:id/read')
  markRead(
    @Param('id') id: string,
    @Req() req: { user: { id: string } },
  ) {
    return this.notifications.markRead(id, req.user.id);
  }

  /** Enregistre un token push Expo/FCM pour l’app mobile */
  @UseGuards(JwtAuthGuard)
  @Post('notifications/push-token')
  async registerPushToken(
    @Req() req: { user: { id: string } },
    @Body() body: { token: string },
  ) {
    const token = String(body.token || '').trim();
    if (!token) return { ok: false };
    const customer = await this.prisma.customer.findUnique({
      where: { id: req.user.id },
    });
    if (!customer) return { ok: false };
    let tokens: string[] = [];
    try {
      tokens = JSON.parse(customer.pushTokens || '[]');
    } catch {
      tokens = [];
    }
    if (!tokens.includes(token)) tokens.push(token);
    await this.prisma.customer.update({
      where: { id: customer.id },
      data: { pushTokens: JSON.stringify(tokens.slice(-20)) },
    });
    return { ok: true, count: tokens.length };
  }

  /** Suivi public par téléphone (optionnel, limité) */
  @Get('notifications/by-phone')
  byPhone(@Query('phone') phone: string) {
    if (!phone || phone.replace(/\s+/g, '').length < 8) return [];
    return this.notifications.listForPhone(phone, 30);
  }

  @UseGuards(AdminJwtAuthGuard)
  @Get('admin/notifications')
  adminList(@Query('limit') limit?: string) {
    return this.notifications.adminList(Number(limit) || 100);
  }

  @UseGuards(AdminJwtAuthGuard)
  @Get('admin/notification-settings')
  getSettings() {
    return this.notifications.getPublicSettings();
  }

  @UseGuards(AdminJwtAuthGuard)
  @Patch('admin/notification-settings')
  updateSettings(
    @Body()
    body: Partial<{
      emailEnabled: boolean;
      smsEnabled: boolean;
      whatsappEnabled: boolean;
      pushEnabled: boolean;
      inAppEnabled: boolean;
      notifyPlaced: boolean;
      notifyPreparing: boolean;
      notifyDeparted: boolean;
      notifyDelivered: boolean;
      notifyCancelled: boolean;
      emailProvider: string;
      emailFrom: string;
      resendApiKey: string;
      smtpHost: string;
      smtpPort: number;
      smtpUser: string;
      smtpPass: string;
      whatsappFrom: string;
    }>,
  ) {
    return this.notifications.updateSettings(body);
  }

  @UseGuards(AdminJwtAuthGuard)
  @Post('admin/notifications/test-email')
  async testEmail(@Body() body: { to?: string }) {
    const to = String(body?.to || '').trim();
    if (!to) throw new BadRequestException('Indiquez un email de test');
    try {
      return await this.notifications.sendTestEmail(to);
    } catch (err) {
      throw new BadRequestException(
        err instanceof Error ? err.message : 'Envoi test impossible',
      );
    }
  }

  @UseGuards(AdminJwtAuthGuard)
  @Post('admin/notifications/test-whatsapp')
  async testWhatsapp(@Body() body: { to?: string }) {
    const to = String(body?.to || '').trim();
    if (!to) throw new BadRequestException('Indiquez un numéro WhatsApp');
    try {
      return await this.notifications.sendTestWhatsapp(to);
    } catch (err) {
      throw new BadRequestException(
        err instanceof Error ? err.message : 'Envoi WhatsApp impossible',
      );
    }
  }
}
