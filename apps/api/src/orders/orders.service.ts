import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { DeliveryService } from './delivery.service';
import {
  discountFromPoints,
  POINT_VALUE_FCFA,
  pointsFromAmount,
} from '../loyalty/loyalty.constants';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loyaltyService: LoyaltyService,
    private readonly deliveryService: DeliveryService,
  ) {}

  async create(dto: CreateOrderDto) {
    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, active: true },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more products are invalid');
    }

    const phone = dto.phone.replace(/\s+/g, '').trim();
    if (!dto.customerId) {
      const linked = await this.prisma.customer.findUnique({ where: { phone } });
      if (linked) dto.customerId = linked.id;
    }

    const byId = new Map(products.map((p) => [p.id, p]));
    const lines = dto.items.map((item) => {
      const product = byId.get(item.productId)!;
      return {
        productId: product.id,
        quantity: item.quantity,
        unitPrice: product.price,
        productName: product.name,
        lineTotal: product.price * item.quantity,
      };
    });

    const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
    const courier = await this.deliveryService.pickCourier(
      `${phone}-${dto.address}`,
    );
    const clientGps =
      dto.destLat != null && dto.destLng != null
        ? { lat: dto.destLat, lng: dto.destLng }
        : null;
    const route = await this.deliveryService.estimateRoute(
      dto.address,
      clientGps,
    );
    const prepSeconds = route.prepSeconds;
    const deliveryFee = route.deliveryFee;
    const grossTotal = subtotal + deliveryFee;

    const loyalty = await this.loyaltyService.getByPhone(phone);
    const requestedPoints = Math.max(0, Math.floor(dto.pointsToUse ?? 0));
    const maxPoints = this.loyaltyService.maxRedeemable(
      loyalty.points,
      grossTotal,
    );
    const pointsRedeemed = Math.min(requestedPoints, maxPoints);
    const pointsDiscount = discountFromPoints(pointsRedeemed);
    const amountDue = Math.max(0, grossTotal - pointsDiscount);
    const paymentMethod =
      pointsRedeemed <= 0
        ? 'cash'
        : amountDue === 0
          ? 'points'
          : 'mixed';

    const estimatedArrivalAt = new Date(
      Date.now() + (prepSeconds + route.durationSeconds) * 1000,
    );
    const invoiceNumber = await this.nextInvoiceNumber();

    if (pointsRedeemed > 0) {
      await this.loyaltyService.redeem(phone, pointsRedeemed);
    }

    const order = await this.prisma.order.create({
      data: {
        invoiceNumber,
        customerId: dto.customerId ?? null,
        customerName: dto.customerName,
        phone,
        address: dto.address,
        note: dto.note,
        subtotal,
        deliveryFee,
        total: grossTotal,
        paymentMethod,
        pointsRedeemed,
        pointsDiscount,
        amountDue,
        status: 'CONFIRMED',
        courierId: courier.id,
        courierName: courier.name,
        courierPhone: courier.phone,
        zoneId: route.zoneId ?? null,
        zoneName: route.zoneName ?? null,
        distanceMeters: route.distanceMeters,
        durationSeconds: route.durationSeconds,
        prepSeconds,
        estimatedArrivalAt,
        destLat: route.destLat,
        destLng: route.destLng,
        storeLat: route.storeLat,
        storeLng: route.storeLng,
        etaSource: route.source,
        mapsUrl: route.mapsUrl,
        items: {
          create: lines.map(
            ({ productId, quantity, unitPrice, productName }) => ({
              productId,
              quantity,
              unitPrice,
              productName,
            }),
          ),
        },
      },
      include: { items: true },
    });

    // Earn points only on the cash portion paid (amount due)
    const earned = pointsFromAmount(amountDue);
    if (earned > 0) {
      await this.loyaltyService.earn(phone, earned);
    }

    return this.toTrackingPayload(order);
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }
    return order;
  }

  async getInvoice(id: string) {
    const order = await this.ensureInvoiceNumber(id);
    const content = await this.prisma.siteContent.findUnique({
      where: { id: 'main' },
    });

    const lines = order.items.map((item) => ({
      id: item.id,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.unitPrice * item.quantity,
    }));

    return {
      id: order.id,
      invoiceNumber: order.invoiceNumber,
      issuedAt: order.createdAt,
      status: order.status,
      customer: {
        name: order.customerName,
        phone: order.phone,
        address: order.address,
      },
      note: order.note,
      courierName: order.courierName,
      zoneName: order.zoneName,
      lines,
      subtotal: order.subtotal || order.total - (order.deliveryFee || 0),
      deliveryFee: order.deliveryFee || 0,
      total: order.total,
      pointsRedeemed: order.pointsRedeemed || 0,
      pointsDiscount: order.pointsDiscount || 0,
      amountDue: order.pointsRedeemed > 0 ? order.amountDue : (order.amountDue || order.total),
      paymentMethod: order.paymentMethod || 'cash',
      pointValue: POINT_VALUE_FCFA,
      currency: 'XOF',
      company: {
        name: content?.brandName ?? 'Reine Univers Business',
        phone: content?.phone ?? '',
        email: content?.email ?? '',
        whatsapp: content?.whatsapp ?? '',
      },
    };
  }

  private async nextInvoiceNumber() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const prefix = `FAC-${y}${m}${d}-`;
    const count = await this.prisma.order.count({
      where: { invoiceNumber: { startsWith: prefix } },
    });
    return `${prefix}${String(count + 1).padStart(4, '0')}`;
  }

  async ensureInvoiceNumber(id: string) {
    let order = await this.findOne(id);
    if (!order.invoiceNumber) {
      const invoiceNumber = await this.nextInvoiceNumber();
      order = await this.prisma.order.update({
        where: { id },
        data: { invoiceNumber },
        include: { items: true },
      });
    }
    return order;
  }

  async backfillInvoiceNumbers() {
    const missing = await this.prisma.order.findMany({
      where: { invoiceNumber: null },
      orderBy: { createdAt: 'asc' },
    });
    for (const order of missing) {
      const invoiceNumber = await this.nextInvoiceNumber();
      await this.prisma.order.update({
        where: { id: order.id },
        data: { invoiceNumber },
      });
    }
    return { updated: missing.length };
  }

  async getTracking(id: string) {
    let order = await this.findOne(id);

    if (
      order.estimatedArrivalAt &&
      order.status !== 'DELIVERED' &&
      order.status !== 'CANCELLED' &&
      order.estimatedArrivalAt.getTime() <= Date.now()
    ) {
      order = await this.prisma.order.update({
        where: { id },
        data: { status: 'DELIVERED' },
        include: { items: true },
      });
    }

    return this.toTrackingPayload(order);
  }

  /** Client shares live GPS so courier can navigate to exact spot */
  async updateClientLocation(id: string, destLat: number, destLng: number) {
    const order = await this.findOne(id);
    if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
      throw new BadRequestException(
        'Impossible de mettre à jour la position sur une commande terminée',
      );
    }

    const storeLat = order.storeLat ?? Number(process.env.STORE_LAT ?? 14.7167);
    const storeLng = order.storeLng ?? Number(process.env.STORE_LNG ?? -17.4677);
    const mapsUrl = this.deliveryService.buildMapsUrl(
      storeLat,
      storeLng,
      order.address,
      destLat,
      destLng,
    );

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        destLat,
        destLng,
        mapsUrl,
        etaSource: order.etaSource === 'zone' ? 'zone' : 'gps',
      },
      include: { items: true },
    });

    return this.toTrackingPayload(updated);
  }

  /** Courier shares live GPS for customer map tracking */
  async updateCourierLocation(
    id: string,
    courierLat: number,
    courierLng: number,
  ) {
    const order = await this.findOne(id);
    if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
      throw new BadRequestException(
        'Impossible de mettre à jour la position sur une commande terminée',
      );
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        courierLat,
        courierLng,
        courierLocationAt: new Date(),
        // Departure implied when courier starts sharing
        prepSeconds: order.prepSeconds > 0 ? 0 : order.prepSeconds,
        status: order.status === 'PENDING' ? 'CONFIRMED' : order.status,
      },
      include: { items: true },
    });

    return this.toTrackingPayload(updated);
  }

  async updateTracking(
    id: string,
    data: {
      courierId?: string | null;
      prepSeconds?: number;
      durationSeconds?: number;
      addMinutes?: number;
      estimatedArrivalAt?: string;
      status?: 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';
      markDeparted?: boolean;
      markArrived?: boolean;
    },
  ) {
    const order = await this.findOne(id);
    const patch: Record<string, unknown> = {};

    if (data.courierId) {
      const courier = await this.prisma.courier.findUnique({
        where: { id: data.courierId },
      });
      if (!courier) throw new NotFoundException('Livreur introuvable');
      patch.courierId = courier.id;
      patch.courierName = courier.name;
      patch.courierPhone = courier.phone;
    }

    if (typeof data.prepSeconds === 'number') {
      patch.prepSeconds = data.prepSeconds;
    }
    if (typeof data.durationSeconds === 'number') {
      patch.durationSeconds = data.durationSeconds;
    }

    let arrival =
      order.estimatedArrivalAt?.getTime() ??
      Date.now() +
        ((order.prepSeconds || 0) + (order.durationSeconds || 0)) * 1000;

    if (data.estimatedArrivalAt) {
      arrival = new Date(data.estimatedArrivalAt).getTime();
    }
    if (typeof data.addMinutes === 'number') {
      arrival += data.addMinutes * 60 * 1000;
    }

    // Mark departed: end prep now, keep remaining travel time
    if (data.markDeparted) {
      const travel = order.durationSeconds || 0;
      patch.prepSeconds = 0;
      arrival = Date.now() + travel * 1000;
      patch.status = 'CONFIRMED';
      if (order.storeLat != null && order.storeLng != null) {
        patch.courierLat = order.storeLat;
        patch.courierLng = order.storeLng;
        patch.courierLocationAt = new Date();
      }
    }

    // Mark arrived: countdown done
    if (data.markArrived) {
      arrival = Date.now();
      patch.status = 'DELIVERED';
    }

    if (data.status) patch.status = data.status;

    patch.estimatedArrivalAt = new Date(arrival);

    // Recalculate window consistency when prep/duration changed without explicit ETA
    if (
      (typeof data.prepSeconds === 'number' ||
        typeof data.durationSeconds === 'number') &&
      !data.estimatedArrivalAt &&
      !data.addMinutes &&
      !data.markDeparted &&
      !data.markArrived
    ) {
      const prep =
        (patch.prepSeconds as number | undefined) ?? order.prepSeconds;
      const dur =
        (patch.durationSeconds as number | undefined) ??
        order.durationSeconds ??
        0;
      patch.estimatedArrivalAt = new Date(Date.now() + (prep + dur) * 1000);
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: patch,
      include: { items: true },
    });
    return this.toTrackingPayload(updated);
  }

  private toTrackingPayload(order: {
    id: string;
    invoiceNumber?: string | null;
    status: string;
    customerName: string;
    address: string;
    phone: string;
    total: number;
    deliveryFee?: number;
    subtotal?: number;
    paymentMethod?: string;
    pointsRedeemed?: number;
    pointsDiscount?: number;
    amountDue?: number;
    courierId?: string | null;
    courierName: string | null;
    courierPhone: string | null;
    zoneId?: string | null;
    zoneName?: string | null;
    distanceMeters: number | null;
    durationSeconds: number | null;
    prepSeconds: number;
    estimatedArrivalAt: Date | null;
    etaSource: string | null;
    mapsUrl: string | null;
    destLat: number | null;
    destLng: number | null;
    storeLat: number | null;
    storeLng: number | null;
    courierLat?: number | null;
    courierLng?: number | null;
    courierLocationAt?: Date | null;
    createdAt: Date;
    items: unknown;
  }) {
    const now = Date.now();
    const arrival = order.estimatedArrivalAt?.getTime() ?? now;
    const totalWindow =
      (order.prepSeconds + (order.durationSeconds ?? 0)) * 1000;
    const remainingMs = Math.max(0, arrival - now);
    const remainingSeconds = Math.ceil(remainingMs / 1000);
    const elapsed = Math.min(
      totalWindow,
      Math.max(0, totalWindow - remainingMs),
    );
    const progress =
      totalWindow > 0
        ? Math.min(1, elapsed / totalWindow)
        : order.status === 'DELIVERED'
          ? 1
          : 0;

    const phase =
      order.status === 'DELIVERED'
        ? 'delivered'
        : order.status === 'CANCELLED'
          ? 'cancelled'
          : remainingSeconds > (order.durationSeconds ?? 0)
            ? 'preparing'
            : 'on_the_way';

    return {
      id: order.id,
      invoiceNumber: order.invoiceNumber ?? null,
      status: order.status,
      phase,
      customerName: order.customerName,
      address: order.address,
      phone: order.phone,
      total: order.total,
      subtotal: order.subtotal ?? order.total,
      deliveryFee: order.deliveryFee ?? 0,
      paymentMethod: order.paymentMethod ?? 'cash',
      pointsRedeemed: order.pointsRedeemed ?? 0,
      pointsDiscount: order.pointsDiscount ?? 0,
      amountDue:
        (order.pointsRedeemed ?? 0) > 0
          ? (order.amountDue ?? 0)
          : (order.amountDue || order.total),
      pointValue: POINT_VALUE_FCFA,
      courierId: order.courierId ?? null,
      courierName: order.courierName,
      courierPhone: order.courierPhone,
      zoneId: order.zoneId ?? null,
      zoneName: order.zoneName ?? null,
      distanceMeters: order.distanceMeters,
      distanceLabel: order.distanceMeters
        ? this.deliveryService.formatDistance(order.distanceMeters)
        : null,
      durationSeconds: order.durationSeconds,
      prepSeconds: order.prepSeconds,
      estimatedArrivalAt: order.estimatedArrivalAt,
      remainingSeconds,
      progress,
      etaSource: order.etaSource,
      mapsUrl: order.mapsUrl,
      navigationUrl:
        order.destLat != null && order.destLng != null
          ? this.deliveryService.navigationUrl(order.destLat, order.destLng)
          : order.mapsUrl,
      destLat: order.destLat,
      destLng: order.destLng,
      storeLat: order.storeLat,
      storeLng: order.storeLng,
      courierLat: order.courierLat ?? null,
      courierLng: order.courierLng ?? null,
      courierLocationAt: order.courierLocationAt ?? null,
      hasGps: order.etaSource === 'gps',
      courierLive: order.courierLat != null && order.courierLng != null,
      items: order.items,
      createdAt: order.createdAt,
    };
  }
}
