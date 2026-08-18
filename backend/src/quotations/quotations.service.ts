import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuotationsService {
  constructor(private prisma: PrismaService) {}

  async createQuotation(data: {
    inquiryId: string;
    items: Array<{
      productId?: string;
      title: string;
      quantity: number;
      unitPrice: number;
    }>;
    gstRate?: number;
    validUntilDays?: number;
    notes?: string;
  }) {
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id: data.inquiryId },
    });
    if (!inquiry) {
      throw new NotFoundException(`Inquiry with ID ${data.inquiryId} not found`);
    }

    const calculatedItems = data.items.map((item) => ({
      ...item,
      lineTotal: item.quantity * item.unitPrice,
    }));

    const subtotal = calculatedItems.reduce(
      (acc, item) => acc + item.lineTotal,
      0,
    );
    const gstRate = data.gstRate !== undefined ? data.gstRate : 18.0;
    const gstAmount = (subtotal * gstRate) / 100;
    const totalAmount = subtotal + gstAmount;

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + (data.validUntilDays || 30));

    const count = await this.prisma.quotation.count();
    const quotationNumber = `RS-QT-${new Date().getFullYear()}-${String(
      count + 1,
    ).padStart(4, '0')}`;

    const quotation = await this.prisma.quotation.create({
      data: {
        quotationNumber,
        inquiryId: data.inquiryId,
        items: calculatedItems as any,
        subtotal,
        gstRate,
        gstAmount,
        totalAmount,
        validUntil,
        notes: data.notes,
        status: 'DRAFT',
      },
      include: {
        inquiry: true,
      },
    });

    // Automatically update inquiry status to QUOTATION_SENT
    await this.prisma.inquiry.update({
      where: { id: data.inquiryId },
      data: { status: 'QUOTATION_SENT' },
    });

    return quotation;
  }

  async findByInquiry(inquiryId: string) {
    return this.prisma.quotation.findMany({
      where: { inquiryId },
      include: { inquiry: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id },
      include: { inquiry: true },
    });
    if (!quotation) {
      throw new NotFoundException(`Quotation with ID ${id} not found`);
    }
    return quotation;
  }

  async updateStatus(id: string, status: any) {
    const quotation = await this.prisma.quotation.findUnique({ where: { id } });
    if (!quotation) {
      throw new NotFoundException(`Quotation with ID ${id} not found`);
    }

    return this.prisma.quotation.update({
      where: { id },
      data: { status },
      include: { inquiry: true },
    });
  }
}
