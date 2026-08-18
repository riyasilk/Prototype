import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { QuotationsService } from './quotations.service';

@Controller('api/v1/quotations')
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Post()
  async createQuotation(@Body() body: any) {
    return this.quotationsService.createQuotation(body);
  }

  @Get('inquiry/:inquiryId')
  async findByInquiry(@Param('inquiryId') inquiryId: string) {
    return this.quotationsService.findByInquiry(inquiryId);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.quotationsService.findById(id);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: any) {
    return this.quotationsService.updateStatus(id, status);
  }
}
