import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  NotificationChannel,
  NotificationEvent,
  type Order,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';

type OrderNotify = Pick<
  Order,
  | 'id'
  | 'invoiceNumber'
  | 'customerName'
  | 'phone'
  | 'address'
  | 'courierName'
  | 'courierPhone'
  | 'amountDue'
  | 'total'
  | 'customerId'
  | 'trackingToken'
>;

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.prisma.notificationSettings.upsert({
      where: { id: 'main' },
      create: { id: 'main' },
      update: {},
    });
  }

  newTrackingToken() {
    return randomBytes(24).toString('hex');
  }

  async getSettings() {
    return this.prisma.notificationSettings.upsert({
      where: { id: 'main' },
      create: { id: 'main' },
      update: {},
    });
  }

  async updateSettings(
    data: Partial<{
      emailEnabled: boolean;
      smsEnabled: boolean;
      pushEnabled: boolean;
      inAppEnabled: boolean;
      notifyPlaced: boolean;
      notifyPreparing: boolean;
      notifyDeparted: boolean;
      notifyDelivered: boolean;
      notifyCancelled: boolean;
    }>,
  ) {
    await this.getSettings();
    return this.prisma.notificationSettings.update({
      where: { id: 'main' },
      data,
    });
  }

  private webBase() {
    return (
      process.env.ADMIN_WEB_URL?.replace(/\/$/, '') ||
      process.env.PUBLIC_WEB_URL?.replace(/\/$/, '') ||
      'http://127.0.0.1:3000'
    );
  }

  private messageFor(event: NotificationEvent, order: OrderNotify) {
    const invoice = order.invoiceNumber || order.id.slice(0, 8);
    const suivi = `${this.webBase()}/suivi/${order.id}`;
    const livreur = order.courierName || 'notre livreur';
    const due = order.amountDue || order.total;

    switch (event) {
      case 'ORDER_PLACED':
        return {
          title: 'Commande reçue',
          body: `Bonjour ${order.customerName}, votre commande ${invoice} est confirmée. Montant à la livraison : ${due} F CFA. Suivi : ${suivi}`,
          sms: `RUB: Commande ${invoice} confirmée. Suivi: ${suivi}`,
        };
      case 'ORDER_PREPARING':
        return {
          title: 'Préparation en cours',
          body: `Votre commande ${invoice} est en préparation. ${livreur} partira bientôt. Suivi : ${suivi}`,
          sms: `RUB: Commande ${invoice} en préparation. Suivi: ${suivi}`,
        };
      case 'COURIER_DEPARTED':
        return {
          title: 'Livreur en route',
          body: `${livreur} a quitté le magasin avec votre commande ${invoice}. Suivez-le en direct : ${suivi}`,
          sms: `RUB: ${livreur} est en route (${invoice}). GPS: ${suivi}`,
        };
      case 'ORDER_DELIVERED':
        return {
          title: 'Commande livrée',
          body: `Votre commande ${invoice} a été livrée. Merci pour votre confiance !`,
          sms: `RUB: Commande ${invoice} livrée. Merci !`,
        };
      case 'ORDER_CANCELLED':
        return {
          title: 'Commande annulée',
          body: `Votre commande ${invoice} a été annulée. Contactez-nous si besoin.`,
          sms: `RUB: Commande ${invoice} annulée.`,
        };
      default:
        return {
          title: 'Mise à jour commande',
          body: `Mise à jour de votre commande ${invoice}. ${suivi}`,
          sms: `RUB: Mise à jour ${invoice}. ${suivi}`,
        };
    }
  }

  private eventEnabled(
    settings: Awaited<ReturnType<typeof this.getSettings>>,
    event: NotificationEvent,
  ) {
    switch (event) {
      case 'ORDER_PLACED':
        return settings.notifyPlaced;
      case 'ORDER_PREPARING':
        return settings.notifyPreparing;
      case 'COURIER_DEPARTED':
        return settings.notifyDeparted;
      case 'ORDER_DELIVERED':
        return settings.notifyDelivered;
      case 'ORDER_CANCELLED':
        return settings.notifyCancelled;
      default:
        return true;
    }
  }

  async notifyOrderEvent(event: NotificationEvent, order: OrderNotify) {
    try {
      const settings = await this.getSettings();
      if (!this.eventEnabled(settings, event)) return;

      const customer = order.customerId
        ? await this.prisma.customer.findUnique({
            where: { id: order.customerId },
          })
        : await this.prisma.customer.findUnique({
            where: { phone: order.phone },
          });

      const msg = this.messageFor(event, order);
      const tasks: Promise<unknown>[] = [];

      if (settings.inAppEnabled) {
        tasks.push(
          this.createAndSend({
            orderId: order.id,
            customerId: customer?.id ?? order.customerId,
            phone: order.phone,
            email: customer?.email ?? null,
            event,
            channel: 'IN_APP',
            title: msg.title,
            body: msg.body,
          }),
        );
      }

      if (settings.emailEnabled && customer?.email) {
        tasks.push(
          this.createAndSend({
            orderId: order.id,
            customerId: customer.id,
            phone: order.phone,
            email: customer.email,
            event,
            channel: 'EMAIL',
            title: msg.title,
            body: msg.body,
          }),
        );
      }

      if (settings.smsEnabled && order.phone) {
        tasks.push(
          this.createAndSend({
            orderId: order.id,
            customerId: customer?.id ?? null,
            phone: order.phone,
            email: customer?.email ?? null,
            event,
            channel: 'SMS',
            title: msg.title,
            body: msg.sms,
          }),
        );
      }

      if (settings.pushEnabled && customer?.pushTokens) {
        tasks.push(
          this.createAndSend({
            orderId: order.id,
            customerId: customer.id,
            phone: order.phone,
            email: customer.email,
            event,
            channel: 'PUSH',
            title: msg.title,
            body: msg.body,
            meta: { pushTokens: customer.pushTokens },
          }),
        );
      }

      await Promise.allSettled(tasks);
    } catch (err) {
      this.logger.error(`notifyOrderEvent(${event}) failed`, err as Error);
    }
  }

  private async createAndSend(input: {
    orderId: string;
    customerId?: string | null;
    phone?: string | null;
    email?: string | null;
    event: NotificationEvent;
    channel: NotificationChannel;
    title: string;
    body: string;
    meta?: Record<string, unknown>;
  }) {
    const row = await this.prisma.notification.create({
      data: {
        orderId: input.orderId,
        customerId: input.customerId ?? null,
        phone: input.phone ?? null,
        email: input.email ?? null,
        event: input.event,
        channel: input.channel,
        title: input.title,
        body: input.body,
        status: 'pending',
        meta: JSON.stringify(input.meta ?? {}),
      },
    });

    try {
      if (input.channel === 'EMAIL') {
        await this.sendEmail(input.email!, input.title, input.body);
      } else if (input.channel === 'SMS') {
        await this.sendSms(input.phone!, input.body);
      } else if (input.channel === 'PUSH') {
        await this.sendPush(input.meta?.pushTokens as string | undefined, {
          title: input.title,
          body: input.body,
          orderId: input.orderId,
        });
      }
      // IN_APP is stored only

      return this.prisma.notification.update({
        where: { id: row.id },
        data: { status: input.channel === 'IN_APP' ? 'sent' : 'sent', sentAt: new Date() },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`${input.channel} failed: ${message}`);
      return this.prisma.notification.update({
        where: { id: row.id },
        data: { status: 'failed', error: message.slice(0, 500) },
      });
    }
  }

  private async sendEmail(to: string, subject: string, text: string) {
    const provider = (process.env.EMAIL_PROVIDER || 'console').toLowerCase();
    if (provider === 'console' || !to) {
      this.logger.log(`[email:${provider}] to=${to} subject=${subject}`);
      return;
    }

    if (provider === 'resend') {
      const key = process.env.RESEND_API_KEY;
      const from = process.env.EMAIL_FROM || 'RUB <onboarding@resend.dev>';
      if (!key) throw new Error('RESEND_API_KEY manquant');
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to: [to], subject, text }),
      });
      if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
      return;
    }

    if (provider === 'smtp') {
      // Dynamic import to keep optional
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to,
        subject,
        text,
      });
      return;
    }

    throw new Error(`EMAIL_PROVIDER inconnu: ${provider}`);
  }

  /** Normalise un numéro SN vers E.164 (+221…) */
  private normalizePhone(raw: string) {
    let phone = String(raw || '').replace(/[\s().-]/g, '');
    if (!phone) return '';
    if (phone.startsWith('00')) phone = `+${phone.slice(2)}`;
    if (phone.startsWith('+')) return phone;
    // Senegal local: 77/78/76/70… → +221
    if (/^(70|75|76|77|78)\d{7}$/.test(phone)) return `+221${phone}`;
    if (/^221\d{9}$/.test(phone)) return `+${phone}`;
    return phone.startsWith('+') ? phone : `+${phone}`;
  }

  private async sendSms(to: string, body: string) {
    const provider = (process.env.SMS_PROVIDER || 'console').toLowerCase();
    const phone = this.normalizePhone(to);
    if (!phone) throw new Error('Numéro SMS invalide');

    if (provider === 'console') {
      this.logger.log(`[sms:console] to=${phone} body=${body}`);
      return;
    }

    if (provider === 'twilio') {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const apiKey = process.env.TWILIO_API_KEY?.trim();
      const apiSecret = process.env.TWILIO_API_SECRET?.trim();
      const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
      // Pour le Sénégal: préférer un Alphanumeric Sender ID (ex: RUBFresh)
      const from = process.env.TWILIO_FROM || 'RUBFresh';
      if (!accountSid) {
        throw new Error('TWILIO_ACCOUNT_SID manquant');
      }
      // API Key (SK…) prioritaire, sinon Auth Token classique
      const user = apiKey || accountSid;
      const pass = apiKey ? apiSecret : authToken;
      if (!pass) {
        throw new Error(
          'Twilio: fournir TWILIO_API_KEY+TWILIO_API_SECRET ou TWILIO_AUTH_TOKEN',
        );
      }
      const auth = Buffer.from(`${user}:${pass}`).toString('base64');
      const params = new URLSearchParams({ To: phone, From: from, Body: body });
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params,
        },
      );
      if (!res.ok) throw new Error(`Twilio ${res.status}: ${await res.text()}`);
      return;
    }

    throw new Error(`SMS_PROVIDER inconnu: ${provider}`);
  }

  private async sendPush(
    pushTokensJson: string | undefined,
    payload: { title: string; body: string; orderId: string },
  ) {
    const provider = (process.env.PUSH_PROVIDER || 'console').toLowerCase();
    let tokens: string[] = [];
    try {
      tokens = JSON.parse(pushTokensJson || '[]');
    } catch {
      tokens = [];
    }
    if (!tokens.length || provider === 'console') {
      this.logger.log(
        `[push:${provider}] tokens=${tokens.length} title=${payload.title}`,
      );
      return;
    }
    // Expo Push API — ready for React Native / Expo apps (Play Store + App Store)
    if (provider === 'expo') {
      const messages = tokens.map((to) => ({
        to,
        title: payload.title,
        body: payload.body,
        data: { orderId: payload.orderId, type: 'order' },
        sound: 'default',
      }));
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messages),
      });
      if (!res.ok) throw new Error(`Expo push ${res.status}: ${await res.text()}`);
      return;
    }
    throw new Error(`PUSH_PROVIDER inconnu: ${provider}`);
  }

  listForPhone(phone: string, limit = 50) {
    return this.prisma.notification.findMany({
      where: { phone: phone.replace(/\s+/g, '') },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  listForCustomer(customerId: string, limit = 50) {
    return this.prisma.notification.findMany({
      where: { customerId, channel: { in: ['IN_APP', 'PUSH'] } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async markRead(id: string, customerId?: string) {
    const n = await this.prisma.notification.findUnique({ where: { id } });
    if (!n) return null;
    if (customerId && n.customerId && n.customerId !== customerId) return null;
    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date(), status: 'read' },
    });
  }

  adminList(limit = 100) {
    return this.prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        order: { select: { id: true, invoiceNumber: true, customerName: true } },
      },
    });
  }
}
