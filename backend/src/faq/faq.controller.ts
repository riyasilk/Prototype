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
import { FaqService } from './faq.service';
import { Public } from '../decorators/public.decorator';

@Controller('api/v1/faqs')
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  @Public()
  @Get()
  async findAll(
    @Query('category') category?: string,
    @Query('published') published?: string,
  ) {
    const isPublished =
      published === 'true' ? true : published === 'false' ? false : undefined;
    return this.faqService.findAll(category, isPublished);
  }

  @Post()
  async create(@Body() body: any) {
    return this.faqService.create(body);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.faqService.update(id, body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.faqService.delete(id);
  }
}
