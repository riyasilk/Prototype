import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { InquiryStatus, Priority } from '@prisma/client';

@Injectable()
export class InquiriesService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async create(createInquiryDto: CreateInquiryDto) {
    const inquiry = await this.prisma.inquiry.create({
      data: {
        company: createInquiryDto.company,
        contactName: createInquiryDto.contactName,
        email: createInquiryDto.email,
        phone: createInquiryDto.phone,
        industry: createInquiryDto.industry,
        quantity: createInquiryDto.quantity,
        budget: createInquiryDto.budget,
        city: createInquiryDto.city,
        state: createInquiryDto.state,
        source: createInquiryDto.source || 'Website',
        message: createInquiryDto.message,
      },
    });

    // Send asynchronous confirmation and dispatch emails on creation
    this.mailService
      .sendInquiryNotification({
        company: inquiry.company,
        contactName: inquiry.contactName,
        email: inquiry.email,
        phone: inquiry.phone,
        industry: inquiry.industry || undefined,
        quantity: inquiry.quantity || undefined,
        message: inquiry.message || undefined,
      })
      .catch(() => {}); // catch errors silently to avoid blocking user returns

    return inquiry;
  }

  async findAll(options: {
    limit: number;
    offset: number;
    search?: string;
    status?: InquiryStatus;
    priority?: Priority;
    assignedToId?: string | null;
  }) {
    const where: any = {};

    if (options.status) {
      where.status = options.status;
    }

    if (options.priority) {
      where.priority = options.priority;
    }

    if (options.assignedToId !== undefined) {
      where.assignedToId = options.assignedToId;
    }

    if (options.search) {
      where.OR = [
        { company: { contains: options.search, mode: 'insensitive' } },
        { contactName: { contains: options.search, mode: 'insensitive' } },
        { email: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.inquiry.findMany({
        where,
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: options.limit,
        skip: options.offset,
      }),
      this.prisma.inquiry.count({ where }),
    ]);

    return { data, total, limit: options.limit, offset: options.offset };
  }

  async findOne(id: string) {
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true, role: true },
        },
        notes: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!inquiry) {
      throw new NotFoundException(`Inquiry with ID ${id} not found`);
    }
    return inquiry;
  }

  async updateStatus(
    id: string,
    status: InquiryStatus,
    userId: string,
    note?: string,
  ) {
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id },
    });
    if (!inquiry) {
      throw new NotFoundException(`Inquiry with ID ${id} not found`);
    }

    const oldStatus = inquiry.status;

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.inquiry.update({
        where: { id },
        data: { status },
      });

      // Write detail audit log entry
      await tx.auditLog.create({
        data: {
          userId,
          action: 'UPDATE_INQUIRY_STATUS',
          entity: 'Inquiry',
          entityId: id,
          oldStatus,
          newStatus: status,
          note: note || null,
        },
      });

      return result;
    });

    return updated;
  }

  async updateFields(
    id: string,
    fields: { priority?: Priority; nextFollowUp?: string | null },
    userId: string,
  ) {
    const inquiry = await this.prisma.inquiry.findUnique({ where: { id } });
    if (!inquiry) {
      throw new NotFoundException(`Inquiry with ID ${id} not found`);
    }

    const updatedData: any = {};
    const auditLogsToCreate: any[] = [];

    if (fields.priority !== undefined && fields.priority !== inquiry.priority) {
      updatedData.priority = fields.priority;
      auditLogsToCreate.push({
        userId,
        action: 'UPDATE_INQUIRY_PRIORITY',
        entity: 'Inquiry',
        entityId: id,
        note: `Priority changed from ${inquiry.priority} to ${fields.priority}`,
      });
    }

    if (fields.nextFollowUp !== undefined) {
      const newFollowUpDate = fields.nextFollowUp
        ? new Date(fields.nextFollowUp)
        : null;
      const oldFollowUpStr = inquiry.nextFollowUp
        ? inquiry.nextFollowUp.toISOString().split('T')[0]
        : 'None';
      const newFollowUpStr = newFollowUpDate
        ? newFollowUpDate.toISOString().split('T')[0]
        : 'None';

      if (oldFollowUpStr !== newFollowUpStr) {
        updatedData.nextFollowUp = newFollowUpDate;
        auditLogsToCreate.push({
          userId,
          action: 'UPDATE_INQUIRY_FOLLOWUP',
          entity: 'Inquiry',
          entityId: id,
          note: `Follow-up date changed from ${oldFollowUpStr} to ${newFollowUpStr}`,
        });
      }
    }

    if (Object.keys(updatedData).length === 0) {
      return inquiry;
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.inquiry.update({
        where: { id },
        data: updatedData,
      });

      for (const logData of auditLogsToCreate) {
        await tx.auditLog.create({ data: logData });
      }

      return updated;
    });

    return result;
  }

  async createNote(id: string, userId: string, text: string) {
    const inquiry = await this.prisma.inquiry.findUnique({ where: { id } });
    if (!inquiry) {
      throw new NotFoundException(`Inquiry with ID ${id} not found`);
    }

    const note = await this.prisma.$transaction(async (tx) => {
      const createdNote = await tx.inquiryNote.create({
        data: {
          inquiryId: id,
          userId,
          text,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'CREATE_INQUIRY_NOTE',
          entity: 'Inquiry',
          entityId: id,
          note: text.substring(0, 60) + (text.length > 60 ? '...' : ''),
        },
      });

      return createdNote;
    });

    return note;
  }

  async assign(id: string, assignedToId: string | null, userId: string) {
    const inquiry = await this.prisma.inquiry.findUnique({ where: { id } });
    if (!inquiry) {
      throw new NotFoundException(`Inquiry with ID ${id} not found`);
    }

    let assignedUserName = 'Unassigned';
    if (assignedToId) {
      const assignedUser = await this.prisma.user.findUnique({
        where: { id: assignedToId },
      });
      if (!assignedUser) {
        throw new NotFoundException(
          `Salesperson with ID ${assignedToId} not found`,
        );
      }
      assignedUserName = assignedUser.name;
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.inquiry.update({
        where: { id },
        data: { assignedToId },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'ASSIGN_INQUIRY',
          entity: 'Inquiry',
          entityId: id,
          note: assignedToId
            ? `Assigned to ${assignedUserName}`
            : 'Removed assignment',
        },
      });

      return result;
    });

    return updated;
  }

  async sendManualEmail(
    id: string,
    subject: string,
    body: string,
    userId: string,
  ) {
    const inquiry = await this.prisma.inquiry.findUnique({ where: { id } });
    if (!inquiry) {
      throw new NotFoundException(`Inquiry with ID ${id} not found`);
    }

    // Call mail service to deliver email
    const mailSent = await this.mailService.sendMail(
      inquiry.email,
      subject,
      body,
    );
    if (!mailSent) {
      throw new Error('Email dispatch failed');
    }

    await this.prisma.$transaction(async (tx) => {
      // Record contacted date on inquiry
      await tx.inquiry.update({
        where: { id },
        data: { lastContactedAt: new Date() },
      });

      // Add to log list
      await tx.auditLog.create({
        data: {
          userId,
          action: 'SEND_INQUIRY_EMAIL',
          entity: 'Inquiry',
          entityId: id,
          note: `Email Sent: "${subject}"`,
        },
      });
    });

    return { success: true };
  }

  async getAuditLogs(inquiryId: string) {
    return this.prisma.auditLog.findMany({
      where: {
        entityId: inquiryId,
        entity: 'Inquiry',
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { timestamp: 'desc' },
    });
  }

  async getAnalytics() {
    const [
      totalInquiries,
      wonLeads,
      lostLeads,
      activeLeads,
      industryGroups,
      statusGroups,
      recentInquiries,
    ] = await Promise.all([
      this.prisma.inquiry.count(),
      this.prisma.inquiry.count({ where: { status: 'WON' } }),
      this.prisma.inquiry.count({ where: { status: 'LOST' } }),
      this.prisma.inquiry.count({
        where: {
          NOT: {
            status: { in: ['WON', 'LOST'] },
          },
        },
      }),
      this.prisma.inquiry.groupBy({
        by: ['industry'],
        _count: { _all: true },
      }),
      this.prisma.inquiry.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.inquiry.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      }),
    ]);

    const conversionRate =
      totalInquiries > 0 ? (wonLeads / totalInquiries) * 100 : 0;

    return {
      totalInquiries,
      wonLeads,
      lostLeads,
      activeLeads,
      conversionRate: Math.round(conversionRate * 10) / 10, // rounds to 1 decimal place
      industryStats: industryGroups.map((g) => ({
        industry: g.industry || 'Other',
        count: g._count._all,
      })),
      statusStats: statusGroups.map((g) => ({
        status: g.status,
        count: g._count._all,
      })),
      recentInquiries: recentInquiries.map((inquiry) => ({
        id: inquiry.id,
        company: inquiry.company,
        contactName: inquiry.contactName,
        email: inquiry.email,
        phone: inquiry.phone,
        status: inquiry.status,
        createdAt: inquiry.createdAt,
        industry: inquiry.industry,
      })),
    };
  }
}
