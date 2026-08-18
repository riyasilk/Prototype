import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InquiriesService } from './inquiries.service';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { InquiryStatus, Priority } from '@prisma/client';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Public } from '../decorators/public.decorator';
import { User } from '../decorators/user.decorator';

@Controller('api/v1/inquiries')
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post()
  async create(@Body() createInquiryDto: CreateInquiryDto) {
    return this.inquiriesService.create(createInquiryDto);
  }

  @Get('analytics/stats')
  async getAnalytics() {
    return this.inquiriesService.getAnalytics();
  }

  // Admin and Sales dashboard listing routes with filtering
  @Get()
  async findAll(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('search') search?: string,
    @Query('status') status?: InquiryStatus,
    @Query('priority') priority?: Priority,
    @Query('assignedToId') assignedToId?: string,
  ) {
    return this.inquiriesService.findAll({
      limit: limit ? Number(limit) : 10,
      offset: offset ? Number(offset) : 0,
      search,
      status,
      priority,
      assignedToId: assignedToId === 'unassigned' ? null : assignedToId,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.inquiriesService.findOne(id);
  }

  @Get(':id/audit-logs')
  async getAuditLogs(@Param('id') id: string) {
    return this.inquiriesService.getAuditLogs(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: InquiryStatus,
    @Body('note') note: string,
    @User() user: any,
  ) {
    return this.inquiriesService.updateStatus(id, status, user.userId, note);
  }

  @Patch(':id/fields')
  async updateFields(
    @Param('id') id: string,
    @Body() fields: { priority?: Priority; nextFollowUp?: string | null },
    @User() user: any,
  ) {
    return this.inquiriesService.updateFields(id, fields, user.userId);
  }

  @Post(':id/notes')
  async createNote(
    @Param('id') id: string,
    @Body('text') text: string,
    @User() user: any,
  ) {
    return this.inquiriesService.createNote(id, user.userId, text);
  }

  @Post(':id/assign')
  async assign(
    @Param('id') id: string,
    @Body('assignedToId') assignedToId: string | null,
    @User() user: any,
  ) {
    return this.inquiriesService.assign(id, assignedToId, user.userId);
  }

  @Post(':id/send-email')
  async sendManualEmail(
    @Param('id') id: string,
    @Body('subject') subject: string,
    @Body('body') body: string,
    @User() user: any,
  ) {
    return this.inquiriesService.sendManualEmail(
      id,
      subject,
      body,
      user.userId,
    );
  }
}
