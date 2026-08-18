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
import { GalleryService } from './gallery.service';
import { Public } from '../decorators/public.decorator';

@Controller('api/v1/gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Public()
  @Get()
  async findAll(
    @Query('category') category?: string,
    @Query('industry') industry?: string,
    @Query('isFeatured') isFeatured?: string,
  ) {
    const featured =
      isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined;
    return this.galleryService.findAll(category, industry, featured);
  }

  @Post()
  async create(
    @Body('imageUrl') imageUrl: string,
    @Body('title') title: string,
    @Body('category') category: string,
    @Body('industry') industry?: string,
    @Body('description') description?: string,
    @Body('altText') altText?: string,
    @Body('seoAlt') seoAlt?: string,
    @Body('isFeatured') isFeatured?: boolean,
    @Body('status') status?: string,
    @Body('order') order?: number,
  ) {
    return this.galleryService.create({
      imageUrl,
      title,
      category,
      industry,
      description,
      altText,
      seoAlt,
      isFeatured,
      status,
      order: order !== undefined ? Number(order) : undefined,
    });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.galleryService.update(id, body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.galleryService.delete(id);
  }
}
