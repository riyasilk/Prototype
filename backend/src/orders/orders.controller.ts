import { Body, Controller, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';

@Controller('api/v1/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async createOrder(@Body() body: any) {
    return this.ordersService.createOrder(body);
  }

  @Get()
  async findAll(@Query('status') status?: string) {
    return this.ordersService.findAll(status);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.ordersService.update(id, body);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: any) {
    return this.ordersService.update(id, { status });
  }
}
