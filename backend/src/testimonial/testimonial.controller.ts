import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { TestimonialService } from './testimonial.service';
import { Public } from '../decorators/public.decorator';

@Controller('api/v1/testimonials')
export class TestimonialController {
  constructor(private readonly testimonialService: TestimonialService) {}

  @Public()
  @Get()
  async findAll(@Query('isFeatured') isFeatured?: string) {
    const featured =
      isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined;
    return this.testimonialService.findAll(featured);
  }

  @Post()
  async create(@Body() body: any) {
    return this.testimonialService.create(body);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.testimonialService.update(id, body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.testimonialService.delete(id);
  }
}
