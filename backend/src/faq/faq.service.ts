import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FaqService {
  constructor(private prisma: PrismaService) {}

  async findAll(category?: string, publishedOnly?: boolean) {
    return this.prisma.fAQ.findMany({
      where: {
        ...(category && { category: { equals: category, mode: 'insensitive' } }),
        ...(publishedOnly !== undefined && { published: publishedOnly }),
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async create(data: {
    question: string;
    answer: string;
    category?: string;
    order?: number;
    published?: boolean;
  }) {
    return this.prisma.fAQ.create({
      data,
    });
  }

  async update(id: string, data: any) {
    const existing = await this.prisma.fAQ.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`FAQ item with ID ${id} not found`);
    }

    return this.prisma.fAQ.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    const existing = await this.prisma.fAQ.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`FAQ item with ID ${id} not found`);
    }

    return this.prisma.fAQ.delete({
      where: { id },
    });
  }
}
