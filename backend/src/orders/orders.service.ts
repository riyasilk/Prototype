import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async createOrder(data: {
    inquiryId?: string;
    customerName: string;
    company: string;
    email: string;
    phone: string;
    products: any;
    totalQuantity: number;
    totalAmount: number;
    advancePayment?: number;
    deliveryDate?: Date;
    notes?: string;
  }) {
    const count = await this.prisma.order.count();
    const orderNumber = `RS-ORD-${new Date().getFullYear()}-${String(
      count + 1,
    ).padStart(4, '0')}`;

    const totalAmount = data.totalAmount;
    const advancePayment = data.advancePayment || 0;
    const remainingPayment = totalAmount - advancePayment;

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        inquiryId: data.inquiryId,
        customerName: data.customerName,
        company: data.company,
        email: data.email,
        phone: data.phone,
        products: data.products,
        totalQuantity: data.totalQuantity,
        totalAmount,
        advancePayment,
        remainingPayment,
        deliveryDate: data.deliveryDate,
        notes: data.notes,
        status: 'ORDER_CONFIRMED',
      },
      include: { inquiry: true },
    });

    if (data.inquiryId) {
      await this.prisma.inquiry.update({
        where: { id: data.inquiryId },
        data: { status: 'WON' },
      });
    }

    return order;
  }

  async findAll(status?: any) {
    return this.prisma.order.findMany({
      where: status ? { status } : undefined,
      include: { inquiry: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { inquiry: true },
    });
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  async update(id: string, data: any) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    if (data.totalAmount !== undefined || data.advancePayment !== undefined) {
      const totalAmount =
        data.totalAmount !== undefined ? data.totalAmount : order.totalAmount;
      const advancePayment =
        data.advancePayment !== undefined
          ? data.advancePayment
          : order.advancePayment;
      data.remainingPayment = totalAmount - advancePayment;
    }

    return this.prisma.order.update({
      where: { id },
      data,
      include: { inquiry: true },
    });
  }
}
