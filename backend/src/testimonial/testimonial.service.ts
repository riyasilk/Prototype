import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TestimonialService {
  constructor(private prisma: PrismaService) {}

  async findAll(isFeatured?: boolean) {
    return this.prisma.testimonial.findMany({
      where: {
        ...(isFeatured !== undefined && { isFeatured }),
      },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async create(data: {
    name: string;
    designation: string;
    company: string;
    category: string;
    industry?: string;
    rating?: number;
    quote: string;
    clientLogo?: string;
    location?: string;
    region?: string;
    isFeatured?: boolean;
    status?: string;
    displayOrder?: number;
  }) {
    return this.prisma.testimonial.create({
      data,
    });
  }

  async update(id: string, data: any) {
    const existing = await this.prisma.testimonial.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Testimonial with ID ${id} not found`);
    }

    return this.prisma.testimonial.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    const existing = await this.prisma.testimonial.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Testimonial with ID ${id} not found`);
    }

    return this.prisma.testimonial.delete({
      where: { id },
    });
  }
}
