import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import { Public } from '../decorators/public.decorator';
import { ProductStatus } from '@prisma/client';

@Controller('api/v1/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post('categories')
  async createCategory(@Body('name') name: string) {
    return this.productsService.createCategory(name);
  }

  @Public()
  @Get('categories')
  async findAllCategories() {
    return this.productsService.findAllCategories();
  }

  @Post('subcategories')
  async createSubcategory(
    @Body('categoryId') categoryId: string,
    @Body('name') name: string,
  ) {
    return this.productsService.createSubcategory(categoryId, name);
  }

  @Public()
  @Get('subcategories')
  async findSubcategories(@Query('categoryId') categoryId?: string) {
    return this.productsService.findSubcategories(categoryId);
  }

  @Post()
  async createProduct(@Body() createProductDto: CreateProductDto) {
    return this.productsService.createProduct(createProductDto);
  }

  @Put(':id')
  async updateProduct(
    @Param('id') id: string,
    @Body() updateProductDto: Partial<UpdateProductDto>,
  ) {
    return this.productsService.updateProduct(id, updateProductDto);
  }

  @Delete(':id')
  async deleteProduct(@Param('id') id: string) {
    return this.productsService.deleteProduct(id);
  }

  @Patch('bulk-status')
  async bulkUpdateStatus(
    @Body('ids') ids: string[],
    @Body('status') status: ProductStatus,
  ) {
    return this.productsService.bulkUpdateStatus(ids, status);
  }

  @Public()
  @Get()
  async findAllProducts(
    @Query('categoryId') categoryId?: string,
    @Query('subcategoryId') subcategoryId?: string,
    @Query('isFeatured') isFeatured?: string,
    @Query('status') status?: ProductStatus,
    @Query('search') search?: string,
  ) {
    const isFeaturedBool =
      isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined;
    return this.productsService.findAllProducts(
      categoryId,
      subcategoryId,
      isFeaturedBool,
      status,
      search,
    );
  }

  @Public()
  @Get(':idOrSlug')
  async findByIdOrSlug(@Param('idOrSlug') idOrSlug: string) {
    return this.productsService.findByIdOrSlug(idOrSlug);
  }
}
