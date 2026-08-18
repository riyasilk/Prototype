import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import { ProductStatus } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async createCategory(name: string) {
    const existing = await this.prisma.category.findUnique({
      where: { name },
    });
    if (existing) {
      throw new ConflictException(`Category "${name}" already exists`);
    }
    return this.prisma.category.create({
      data: { name },
      include: { subcategories: true },
    });
  }

  async findAllCategories() {
    return this.prisma.category.findMany({
      include: {
        subcategories: true,
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createSubcategory(categoryId: string, name: string) {
    const existingCategory = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!existingCategory) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    return this.prisma.subcategory.upsert({
      where: {
        name_categoryId: { name, categoryId },
      },
      update: {},
      create: { name, categoryId },
    });
  }

  async findSubcategories(categoryId?: string) {
    return this.prisma.subcategory.findMany({
      where: categoryId ? { categoryId } : undefined,
      include: {
        category: true,
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createProduct(dto: CreateProductDto) {
    const existing = await this.prisma.product.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException(`Product slug "${dto.slug}" already exists`);
    }

    const { images, availableSizes, availableColors, features, ...productData } = dto;

    return this.prisma.product.create({
      data: {
        ...productData,
        availableSizes: availableSizes || ['S', 'M', 'L', 'XL', 'XXL'],
        availableColors: availableColors || ['White', 'Navy', 'Black', 'Blue'],
        features: features || [],
        images: {
          create: (images || []).map((url) => ({ url })),
        },
      },
      include: {
        images: true,
        category: true,
        subcategory: true,
      },
    });
  }

  async updateProduct(id: string, dto: Partial<UpdateProductDto>) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const { images, availableSizes, availableColors, features, ...productData } = dto;

    // Handle image updates if provided
    if (images !== undefined) {
      await this.prisma.productImage.deleteMany({ where: { productId: id } });
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        ...productData,
        ...(availableSizes !== undefined && { availableSizes }),
        ...(availableColors !== undefined && { availableColors }),
        ...(features !== undefined && { features }),
        ...(images !== undefined && {
          images: {
            create: images.map((url) => ({ url })),
          },
        }),
      },
      include: {
        images: true,
        category: true,
        subcategory: true,
      },
    });
  }

  async deleteProduct(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return this.prisma.product.delete({
      where: { id },
    });
  }

  async bulkUpdateStatus(ids: string[], status: ProductStatus) {
    return this.prisma.product.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });
  }

  async findAllProducts(
    categoryId?: string,
    subcategoryId?: string,
    isFeatured?: boolean,
    status?: ProductStatus,
    search?: string,
  ) {
    return this.prisma.product.findMany({
      where: {
        ...(categoryId && { categoryId }),
        ...(subcategoryId && { subcategoryId }),
        ...(isFeatured !== undefined && { isFeatured }),
        ...(status && { status }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { shortDescription: { contains: search, mode: 'insensitive' } },
            { fabricComposition: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        images: true,
        category: true,
        subcategory: true,
      },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findByIdOrSlug(idOrSlug: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        images: true,
        category: true,
        subcategory: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID or Slug "${idOrSlug}" not found`);
    }

    return product;
  }
}
