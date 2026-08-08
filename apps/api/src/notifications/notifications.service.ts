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
  | 'customerId'
  | 'customerName'
  | 'phone'
  | 'address'
  | 'courierName'
  | 'courierPhone'
  | 'amountDue'
  | 'total'
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
      emailProvider: string;
      emailFrom: string;
      resendApiKey: string;
      smtpHost: string;
      smtpPort: number;
      smtpUser: string;
      smtpPass: string;
    }>,
  ) {
    await this.getSettings();
    const patch: Record<string, unknown> = { ...data };
    // Don't wipe secrets when the admin leaves the field blank
    if (patch.resendApiKey === '' || patch.resendApiKey === undefined) {
      delete patch.resendApiKey;
    }
    if (patch.smtpPass === '' || patch.smtpPass === undefined) {
      delete patch.smtpPass;
    }
    await this.prisma.notificationSettings.update({
      where: { id: 'main' },
      data: patch,
    });
    return this.getPublicSettings();
  }

  async getPublicSettings() {
    const s = await this.getSettings();
    const provider = this.resolveEmailProvider(s);
    return {
      emailEnabled: s.emailEnabled,
      smsEnabled: s.smsEnabled,
      pushEnabled: s.pushEnabled,
      inAppEnabled: s.inAppEnabled,
      notifyPlaced: s.notifyPlaced,
      notifyPreparing: s.notifyPreparing,
      notifyDeparted: s.notifyDeparted,
      notifyDelivered: s.notifyDelivered,
      notifyCancelled: s.notifyCancelled,
      emailProvider: s.emailProvider || process.env.EMAIL_PROVIDER || 'console',
      emailFrom:
        s.emailFrom ||
        process.env.EMAIL_FROM ||
        'RUBFresh <onboarding@resend.dev>',
      smtpHost: s.smtpHost || process.env.SMTP_HOST || '',
      smtpPort: s.smtpPort || Number(process.env.SMTP_PORT || 587),
      smtpUser: s.smtpUser || process.env.SMTP_USER || '',
      resendApiKeySet: Boolean(s.resendApiKey || process.env.RESEND_API_KEY),
      smtpPassSet: Boolean(s.smtpPass || process.env.SMTP_PASS),
      emailReady: provider === 'resend' || provider === 'smtp',
      resolvedEmailProvider: provider,
    };
  }

  private resolveEmailProvider(
    settings: Awaited<ReturnType<typeof this.getSettings>>,
  ) {
    const fromDb = (settings.emailProvider || '').toLowerCase().trim();
    if (fromDb === 'resend' || fromDb === 'smtp' || fromDb === 'console') {
      return fromDb;
    }
    if (settings.resendApiKey || process.env.RESEND_API_KEY) return 'resend';
    if (settings.smtpHost || process.env.SMTP_HOST) return 'smtp';
    return (process.env.EMAIL_PROVIDER || 'console').toLowerCase();
  }

  private webBase() {
    return (
      process.env.PUBLIC_WEB_URL?.replace(/\/$/, '') ||
      process.env.ADMIN_WEB_URL?.replace(/\/$/, '') ||
      'https://www.rubfresh.com'
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

  private async resolveCustomer(order: OrderNotify) {
    if (order.customerId) {
      const byId = await this.prisma.customer.findUnique({
        where: { id: order.customerId },
      });
      if (byId) return byId;
    }
    const phone = String(order.phone || '').replace(/\s+/g, '').trim();
    if (!phone) return null;
    const byPhone = await this.prisma.customer.findUnique({ where: { phone } });
    if (byPhone) return byPhone;
    // Try without country code variants
    const digits = phone.replace(/^\+?221/, '');
    if (digits !== phone) {
      return this.prisma.customer.findUnique({ where: { phone: digits } });
    }
    return null;
  }

  async notifyOrderEvent(event: NotificationEvent, order: OrderNotify) {
    try {
      const settings = await this.getSettings();
      if (!this.eventEnabled(settings, event)) return;

      const customer = await this.resolveCustomer(order);
      const email = customer?.email?.trim() || null;
      const msg = this.messageFor(event, order);
      const tasks: Promise<unknown>[] = [];

      if (settings.inAppEnabled) {
        tasks.push(
          this.createAndSend({
            orderId: order.id,
            customerId: customer?.id ?? order.customerId,
            phone: order.phone,
            email,
            event,
            channel: 'IN_APP',
            title: msg.title,
            body: msg.body,
          }),
        );
      }

      if (settings.emailEnabled) {
        if (email) {
          tasks.push(
            this.createAndSend({
              orderId: order.id,
              customerId: customer?.id ?? null,
              phone: order.phone,
              email,
              event,
              channel: 'EMAIL',
              title: msg.title,
              body: msg.body,
            }),
          );
        } else {
          this.logger.warn(
            `EMAIL skipped for ${event}/${order.id}: no customer email`,
          );
          await this.prisma.notification.create({
            data: {
              orderId: order.id,
              customerId: customer?.id ?? null,
              phone: order.phone,
              email: null,
              event,
              channel: 'EMAIL',
              title: msg.title,
              body: msg.body,
              status: 'failed',
              error: 'Pas d’email client — renseignez l’email du compte',
            },
          });
        }
      }

      if (settings.smsEnabled && order.phone) {
        tasks.push(
          this.createAndSend({
            orderId: order.id,
            customerId: customer?.id ?? null,
            phone: order.phone,
            email,
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
            email,
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

  /** Envoi de test depuis l’admin */
  async sendTestEmail(to: string) {
    const email = to.trim().toLowerCase();
    if (!email.includes('@')) {
      throw new Error('Email de test invalide');
    }
    await this.sendEmail(
      email,
      'Test RUBFresh — notifications email',
      'Ceci est un email de test. Si vous le recevez, les notifications commande sont prêtes.',
    );
    return { ok: true, to: email };
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

  private emailHtml(subject: string, text: string) {
    const safe = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const withLinks = safe.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" style="color:#c45c26;word-break:break-all">$1</a>',
    );
    return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f6f3ef;font-family:Georgia,serif">
  <div style="max-width:560px;margin:24px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e8e0d6">
    <div style="background:#1a1a1a;color:#fff;padding:20px 24px;font-size:20px;letter-spacing:0.04em">RUBFresh</div>
    <div style="padding:24px">
      <h1 style="margin:0 0 12px;font-size:22px;color:#1a1a1a">${subject.replace(/</g, '')}</h1>
      <p style="margin:0;line-height:1.6;color:#333;white-space:pre-wrap;font-family:system-ui,sans-serif;font-size:15px">${withLinks}</p>
    </div>
    <div style="padding:16px 24px;background:#f6f3ef;color:#777;font-size:12px;font-family:system-ui,sans-serif">
      Reine Univers Business · viande fraîche livrée
    </div>
  </div>
</body></html>`;
  }

  private async sendEmail(to: string, subject: string, text: string) {
    if (!to) throw new Error('Destinataire email manquant');
    const settings = await this.getSettings();
    const provider = this.resolveEmailProvider(settings);
    const from =
      settings.emailFrom?.trim() ||
      process.env.EMAIL_FROM ||
      'RUBFresh <onboarding@resend.dev>';
    const html = this.emailHtml(subject, text);

    if (provider === 'console') {
      this.logger.warn(
        `[email:console] BLOQUÉ — configurez Resend dans Admin → Notifications. to=${to} subject=${subject}`,
      );
      throw new Error(
        'Email non configuré (mode console). Ajoutez une clé Resend dans Admin → Notifications.',
      );
    }

    if (provider === 'resend') {
      const key = settings.resendApiKey || process.env.RESEND_API_KEY;
      if (!key) throw new Error('Clé Resend manquante');
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to: [to], subject, text, html }),
      });
      if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
      this.logger.log(`[email:resend] sent to=${to} subject=${subject}`);
      return;
    }

    if (provider === 'smtp') {
      const host = settings.smtpHost || process.env.SMTP_HOST;
      const user = settings.smtpUser || process.env.SMTP_USER;
      const pass = settings.smtpPass || process.env.SMTP_PASS;
      if (!host || !user || !pass) {
        throw new Error('SMTP incomplet (host / user / pass)');
      }
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        host,
        port: settings.smtpPort || Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user, pass },
      });
      await transporter.sendMail({
        from: from || user,
        to,
        subject,
        text,
        html,
      });
      this.logger.log(`[email:smtp] sent to=${to} subject=${subject}`);
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
