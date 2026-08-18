import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GalleryService {
  constructor(private prisma: PrismaService) {}

  async findAll(category?: string, industry?: string, isFeatured?: boolean) {
    return this.prisma.gallery.findMany({
      where: {
        ...(category &&
          category !== 'Show All' && {
            category: { equals: category, mode: 'insensitive' },
          }),
        ...(industry && {
          industry: { equals: industry, mode: 'insensitive' },
        }),
        ...(isFeatured !== undefined && { isFeatured }),
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async create(data: {
    imageUrl: string;
    title: string;
    category: string;
    industry?: string;
    description?: string;
    altText?: string;
    seoAlt?: string;
    isFeatured?: boolean;
    status?: string;
    order?: number;
  }) {
    return this.prisma.gallery.create({
      data,
    });
  }

  async update(
    id: string,
    data: Partial<{
      imageUrl: string;
      title: string;
      category: string;
      industry: string;
      description: string;
      altText: string;
      seoAlt: string;
      isFeatured: boolean;
      status: string;
      order: number;
    }>,
  ) {
    const existing = await this.prisma.gallery.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Gallery item with ID ${id} not found`);
    }

    return this.prisma.gallery.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    const existing = await this.prisma.gallery.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Gallery item with ID ${id} not found`);
    }

    return this.prisma.gallery.delete({
      where: { id },
    });
  }
}
