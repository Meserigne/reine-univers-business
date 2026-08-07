import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function mapProduct<T extends { categoryId: string }>(product: T) {
  return {
    ...product,
    category: product.categoryId,
  };
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(category?: string, cut?: string) {
    const products = await this.prisma.product.findMany({
      where: {
        active: true,
        ...(category ? { categoryId: category } : {}),
        ...(cut ? { cut } : {}),
        category: { active: true },
      },
      include: { category: true },
      orderBy: [{ categoryId: 'asc' }, { name: 'asc' }],
    });
    return products.map(mapProduct);
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, active: true },
      include: { category: true },
    });
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return mapProduct(product);
  }

  async findAllAdmin() {
    const products = await this.prisma.product.findMany({
      include: { category: true },
      orderBy: [{ categoryId: 'asc' }, { name: 'asc' }],
    });
    return products.map(mapProduct);
  }

  async create(data: {
    id: string;
    name: string;
    description: string;
    price: number;
    unit: string;
    categoryId: string;
    cut: string;
    image: string;
    badge?: string;
    popular?: boolean;
    active?: boolean;
  }) {
    const product = await this.prisma.product.create({
      data: {
        id: data.id,
        name: data.name,
        description: data.description,
        price: data.price,
        unit: data.unit,
        categoryId: data.categoryId,
        cut: data.cut,
        image: data.image,
        badge: data.badge,
        popular: data.popular ?? false,
        active: data.active ?? true,
      },
      include: { category: true },
    });
    return mapProduct(product);
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      price: number;
      unit: string;
      categoryId: string;
      cut: string;
      image: string;
      badge: string | null;
      popular: boolean;
      active: boolean;
    }>,
  ) {
    const product = await this.prisma.product.update({
      where: { id },
      data,
      include: { category: true },
    });
    return mapProduct(product);
  }

  async remove(id: string) {
    await this.prisma.product.delete({ where: { id } });
    return { ok: true };
  }
}
