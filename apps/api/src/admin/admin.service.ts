import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { PagesService } from '../pages/pages.service';
import { OrdersService } from '../orders/orders.service';
import { DeliveryService } from '../orders/delivery.service';
import { AdminAuthService } from '../auth/admin-auth.service';
import {
  CreateAdminAccountDto,
  CreateCategoryDto,
  CreateCourierDto,
  CreateCustomerDto,
  CreateProductDto,
  CreateZoneDto,
  UpdateAdminAccountDto,
  UpdateAdminAuthSettingsDto,
  UpdateCategoryDto,
  UpdateCourierDto,
  UpdateDeliverySettingsDto,
  UpdateOrderTrackingDto,
  UpdateProductDto,
  UpdateSiteContentDto,
  UpdateZoneDto,
} from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
    private readonly pagesService: PagesService,
    private readonly ordersService: OrdersService,
    private readonly deliveryService: DeliveryService,
    private readonly adminAuth: AdminAuthService,
  ) {}

  async stats() {
    const [products, categories, orders, messages, loyalty] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.category.count(),
      this.prisma.order.count(),
      this.prisma.contactMessage.count(),
      this.prisma.loyaltyAccount.count(),
    ]);
    const pendingOrders = await this.prisma.order.count({
      where: { status: 'PENDING' },
    });
    const revenue = await this.prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { in: ['CONFIRMED', 'DELIVERED'] } },
    });
    return {
      products,
      categories,
      orders,
      pendingOrders,
      messages,
      loyaltyAccounts: loyalty,
      revenue: revenue._sum.total ?? 0,
    };
  }

  listCategories() {
    return this.prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { products: true } } },
    });
  }

  async createCategory(dto: CreateCategoryDto) {
    const exists = await this.prisma.category.findUnique({
      where: { id: dto.id },
    });
    if (exists) {
      throw new ConflictException(`Category ${dto.id} already exists`);
    }
    return this.prisma.category.create({
      data: {
        id: dto.id.toLowerCase().replace(/\s+/g, '-'),
        label: dto.label,
        description: dto.description,
        image: dto.image,
        sortOrder: dto.sortOrder ?? 0,
        active: dto.active ?? true,
      },
    });
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    try {
      return await this.prisma.category.update({
        where: { id },
        data: dto,
      });
    } catch {
      throw new NotFoundException(`Category ${id} not found`);
    }
  }

  async deleteCategory(id: string) {
    const count = await this.prisma.product.count({ where: { categoryId: id } });
    if (count > 0) {
      throw new ConflictException(
        `Impossible de supprimer : ${count} produit(s) liés. Désactivez la catégorie à la place.`,
      );
    }
    await this.prisma.category.delete({ where: { id } });
    return { ok: true };
  }

  listProducts() {
    return this.productsService.findAllAdmin();
  }

  createProduct(dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  updateProduct(id: string, dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  deleteProduct(id: string) {
    return this.productsService.remove(id);
  }

  listOrders() {
    return this.prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    }).then((orders) =>
      orders.map((o) => ({
        ...o,
        livreurPath: o.trackingToken
          ? `/livreur/${o.id}?token=${o.trackingToken}`
          : `/livreur/${o.id}`,
      })),
    );
  }

  createOrder(dto: {
    customerName: string;
    phone: string;
    address: string;
    note?: string;
    items: { productId: string; quantity: number }[];
  }) {
    return this.ordersService.create(dto);
  }

  async listInvoices() {
    await this.ordersService.backfillInvoiceNumbers();
    const orders = await this.prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      where: { status: { not: 'CANCELLED' } },
    });
    return orders.map((o) => ({
      id: o.id,
      invoiceNumber: o.invoiceNumber,
      customerName: o.customerName,
      phone: o.phone,
      address: o.address,
      status: o.status,
      total: o.total,
      itemCount: o.items.reduce((n, i) => n + i.quantity, 0),
      createdAt: o.createdAt,
      courierName: o.courierName,
    }));
  }

  getInvoice(id: string) {
    return this.ordersService.getInvoice(id);
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

  async createCustomer(dto: CreateCustomerDto) {
    const phone = dto.phone.replace(/\s+/g, '').trim();
    const existing = await this.prisma.customer.findUnique({ where: { phone } });
    if (existing) {
      throw new ConflictException('Un compte existe déjà avec ce téléphone');
    }
    const email = dto.email?.toLowerCase().trim() || null;
    if (email) {
      const emailTaken = await this.prisma.customer.findUnique({ where: { email } });
      if (emailTaken) {
        throw new ConflictException('Cet email est déjà utilisé');
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const customer = await this.prisma.customer.create({
      data: {
        name: dto.name.trim(),
        phone,
        email,
        address: dto.address?.trim() || null,
        passwordHash,
      },
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

    await this.prisma.loyaltyAccount.upsert({
      where: { phone },
      create: { phone, points: 0 },
      update: {},
    });

    return customer;
  }

  async updateOrderStatus(id: string, status: OrderStatus) {
    return this.ordersService.applyStatus(id, status);
  }

  getContent() {
    return this.pagesService.getSiteContent();
  }

  updateContent(dto: UpdateSiteContentDto) {
    return this.pagesService.updateSiteContent(dto);
  }

  listMessages() {
    return this.prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteMessage(id: string) {
    await this.prisma.contactMessage.delete({ where: { id } });
    return { ok: true };
  }

  listLoyalty() {
    return this.prisma.loyaltyAccount.findMany({
      orderBy: { points: 'desc' },
    });
  }

  listCouriers() {
    return this.prisma.courier.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { orders: true } } },
    });
  }

  createCourier(dto: CreateCourierDto) {
    return this.prisma.courier.create({
      data: {
        name: dto.name.trim(),
        phone: dto.phone.replace(/\s+/g, ''),
        active: dto.active ?? true,
        available: dto.available ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async updateCourier(id: string, dto: UpdateCourierDto) {
    try {
      return await this.prisma.courier.update({
        where: { id },
        data: {
          ...dto,
          phone: dto.phone ? dto.phone.replace(/\s+/g, '') : undefined,
        },
      });
    } catch {
      throw new NotFoundException(`Livreur ${id} introuvable`);
    }
  }

  async deleteCourier(id: string) {
    const count = await this.prisma.order.count({ where: { courierId: id } });
    if (count > 0) {
      await this.prisma.courier.update({
        where: { id },
        data: { active: false, available: false },
      });
      return { ok: true, deactivated: true };
    }
    await this.prisma.courier.delete({ where: { id } });
    return { ok: true };
  }

  listZones() {
    return this.prisma.deliveryZone.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { orders: true } } },
    });
  }

  createZone(dto: CreateZoneDto) {
    return this.prisma.deliveryZone.create({
      data: {
        name: dto.name.trim(),
        keywords: dto.keywords.trim(),
        fee: dto.fee ?? 0,
        durationMinutes: dto.durationMinutes ?? 25,
        prepMinutes: dto.prepMinutes ?? 8,
        active: dto.active ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async updateZone(id: string, dto: UpdateZoneDto) {
    try {
      return await this.prisma.deliveryZone.update({
        where: { id },
        data: dto,
      });
    } catch {
      throw new NotFoundException(`Zone ${id} introuvable`);
    }
  }

  async deleteZone(id: string) {
    const count = await this.prisma.order.count({ where: { zoneId: id } });
    if (count > 0) {
      await this.prisma.deliveryZone.update({
        where: { id },
        data: { active: false },
      });
      return { ok: true, deactivated: true };
    }
    await this.prisma.deliveryZone.delete({ where: { id } });
    return { ok: true };
  }

  getDeliverySettings() {
    return this.deliveryService.getSettings();
  }

  updateDeliverySettings(dto: UpdateDeliverySettingsDto) {
    return this.deliveryService.updateSettings(dto);
  }

  updateOrderTracking(id: string, dto: UpdateOrderTrackingDto) {
    return this.ordersService.updateTracking(id, dto);
  }

  async seedDeliveryDefaults() {
    const courierCount = await this.prisma.courier.count();
    if (courierCount === 0) {
      await this.prisma.courier.createMany({
        data: [
          { name: 'Moussa Diop', phone: '+221771234501', sortOrder: 1 },
          { name: 'Awa Ndiaye', phone: '+221771234502', sortOrder: 2 },
          { name: 'Ibrahima Sarr', phone: '+221771234503', sortOrder: 3 },
          { name: 'Fatou Ba', phone: '+221771234504', sortOrder: 4 },
          { name: 'Cheikh Fall', phone: '+221771234505', sortOrder: 5 },
          { name: 'Mariama Sy', phone: '+221771234506', sortOrder: 6 },
        ],
      });
    }

    const zoneCount = await this.prisma.deliveryZone.count();
    if (zoneCount === 0) {
      await this.prisma.deliveryZone.createMany({
        data: [
          {
            name: 'Plateau',
            keywords: 'plateau,centre ville,independence',
            fee: 500,
            durationMinutes: 20,
            prepMinutes: 8,
            sortOrder: 1,
          },
          {
            name: 'Almadies',
            keywords: 'almadies,ngor,yoff',
            fee: 1500,
            durationMinutes: 35,
            prepMinutes: 10,
            sortOrder: 2,
          },
          {
            name: 'Ouakam / Mermoz',
            keywords: 'ouakam,mermoz,sacré cœur,sacre coeur',
            fee: 1000,
            durationMinutes: 30,
            prepMinutes: 8,
            sortOrder: 3,
          },
          {
            name: 'Parcelles Assainies',
            keywords: "parcelles,patte d'oie,grand yoff",
            fee: 1500,
            durationMinutes: 40,
            prepMinutes: 10,
            sortOrder: 4,
          },
          {
            name: 'Pikine / Guédiawaye',
            keywords: 'pikine,guediawaye,guédiawaye,thiaroye',
            fee: 2000,
            durationMinutes: 50,
            prepMinutes: 12,
            sortOrder: 5,
          },
        ],
      });
    }

    await this.deliveryService.getSettings();
    return { ok: true };
  }

  listAdminAccounts() {
    return this.adminAuth.listAccounts();
  }

  createAdminAccount(dto: CreateAdminAccountDto) {
    return this.adminAuth.createAccount(dto);
  }

  updateAdminAccount(id: string, dto: UpdateAdminAccountDto) {
    return this.adminAuth.updateAccount(id, dto);
  }

  deleteAdminAccount(id: string) {
    return this.adminAuth.deleteAccount(id);
  }

  getAdminAuthSettings() {
    return this.adminAuth.getAuthSettingsPublic();
  }

  updateAdminAuthSettings(dto: UpdateAdminAuthSettingsDto) {
    return this.adminAuth.updateAuthSettings(dto);
  }
}
