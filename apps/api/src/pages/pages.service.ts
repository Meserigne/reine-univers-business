import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PagesService {
  constructor(private readonly prisma: PrismaService) {}

  async getSiteContent() {
    const content = await this.prisma.siteContent.findUnique({
      where: { id: 'main' },
    });
    if (!content) {
      throw new NotFoundException('Site content not seeded. Run npm run db:seed');
    }
    return content;
  }

  async getHome() {
    const content = await this.getSiteContent();
    const featured = await this.prisma.product.findMany({
      where: { active: true, popular: true, category: { active: true } },
      orderBy: { name: 'asc' },
      take: 8,
    });

    return {
      brandName: content.brandName,
      hero: {
        title: content.heroTitle,
        subtitle: content.heroSubtitle,
        ctaLabel: content.ctaLabel,
        ctaHref: '/commander',
      },
      menu: [
        { label: 'Accueil', href: '/' },
        { label: 'Catalogue', href: '/commander' },
        { label: 'Livraison', href: '/commander#livraison' },
        { label: 'Fidélité', href: '/commander#fidelite' },
        { label: 'Contact', href: '/commander#contact' },
      ],
      featured: featured.map((p) => ({ ...p, category: p.categoryId })),
      contact: {
        phone: content.phone,
        whatsapp: content.whatsapp,
        email: content.email,
      },
    };
  }

  async getShop() {
    const content = await this.getSiteContent();
    const dbCategories = await this.prisma.category.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });
    const categories = [
      { id: 'tous', label: 'Tout' },
      ...dbCategories.map((c) => ({ id: c.id, label: c.label })),
    ];

    return {
      brandName: content.brandName,
      catalogue: {
        eyebrow: 'Catalogue',
        title: 'Viande fraîche du jour',
        categories,
      },
      delivery: {
        eyebrow: content.deliveryEyebrow,
        title: content.deliveryTitle,
        text: content.deliveryText,
        points: [
          {
            id: 'fast',
            title: 'Livraison rapide',
            text: content.deliveryFast,
          },
          {
            id: 'hours',
            title: 'Horaires',
            text: content.deliveryHours,
          },
          {
            id: 'zones',
            title: 'Zones couvertes',
            text: content.deliveryZones,
          },
        ],
      },
      loyalty: {
        eyebrow: content.loyaltyEyebrow,
        title: content.loyaltyTitle,
        text: content.loyaltyText,
      },
      contact: {
        phone: content.phone,
        whatsapp: content.whatsapp,
        email: content.email,
      },
    };
  }

  async updateSiteContent(data: Partial<{
    brandName: string;
    heroTitle: string;
    heroSubtitle: string;
    ctaLabel: string;
    deliveryEyebrow: string;
    deliveryTitle: string;
    deliveryText: string;
    deliveryFast: string;
    deliveryHours: string;
    deliveryZones: string;
    loyaltyEyebrow: string;
    loyaltyTitle: string;
    loyaltyText: string;
    phone: string;
    whatsapp: string;
    email: string;
  }>) {
    return this.prisma.siteContent.update({
      where: { id: 'main' },
      data,
    });
  }
}
