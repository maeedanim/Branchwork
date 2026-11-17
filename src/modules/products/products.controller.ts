
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { GetUser } from '../../common/request-metadata/getUser.decorator';
import type { RequestUser } from '../../common/interfaces/request-user.interface';
import type { PaginatedResult } from '../../common/interfaces/pagination.interface';
import { PERMISSIONS } from '../../common/constants/permissions.constants';

import { OwnerOnly } from '../auth/decorators/auth.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

import { Product } from '../../schemas/Product.schema';
import { ProductsService } from './products.service';

import { CreateProductDto } from './dto/create-product.dto';
import { OrganizeProductDto } from './dto/organize-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { ProductResponseDto } from './dto/product-response.dto';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
  ) {}

  @Post()
  @OwnerOnly()
  @ApiOperation({
    summary: 'Create a product',
    description: 'OWNER only. The branch must belong to the authenticated organization.',
  })
  @ApiResponse({ status: 201, description: 'Product created successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid product data.' })
  @ApiResponse({ status: 404, description: 'Branch not found.' })
  async create(
    @GetUser() requester: RequestUser,
    @Body() dto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    const product = await this.productsService.create(
      requester.organizationId,
      dto,
    );

    return this.toResponse(product);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.PRODUCT_VIEW)
  @ApiOperation({
    summary: 'Get paginated products',
    description: 'OWNER can view all organization products and optionally filter by branch. STAFF can only view products in their assigned branch.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully.' })
  @ApiResponse({ status: 403, description: 'Missing required permission.' })
  async findAll(
    @GetUser() requester: RequestUser,
    @Query() query: ProductQueryDto,
  ): Promise<PaginatedResult<ProductResponseDto>> {
    const result = await this.productsService.findAll(
      requester,
      {
        page: query.page,
        limit: query.limit,
      },
      query.branchId,
    );

    return {
      items: result.items.map((product) =>
        this.toResponse(product),
      ),
      meta: result.meta,
    };
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.PRODUCT_VIEW)
  @ApiOperation({
    summary: 'Get a product by ID',
    description: 'STAFF can only access products belonging to their assigned branch.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  async findById(
    @GetUser() requester: RequestUser,
    @Param('id', ParseUUIDPipe) productId: string,
  ): Promise<ProductResponseDto> {
    const product = await this.productsService.findById(
      requester,
      productId,
    );

    return this.toResponse(product);
  }

  @Patch(':id/organize')
  @RequirePermissions(
    PERMISSIONS.PRODUCT_VIEW,
    PERMISSIONS.PRODUCT_ORGANIZE,
  )
  @ApiOperation({
    summary: 'Organize a product',
    description: 'Requires both product.view and product.organize. At least one of category, stock, or branchId must be provided.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Product organized successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid update data.' })
  @ApiResponse({ status: 404, description: 'Product or destination branch not found.' })
  async organize(
    @GetUser() requester: RequestUser,
    @Param('id', ParseUUIDPipe) productId: string,
    @Body() dto: OrganizeProductDto,
  ): Promise<ProductResponseDto> {
    const product = await this.productsService.organize(
      requester,
      productId,
      dto,
    );

    return this.toResponse(product);
  }

  @Delete(':id')
  @OwnerOnly()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a product',
    description: 'OWNER only.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  async delete(
    @GetUser() requester: RequestUser,
    @Param('id', ParseUUIDPipe) productId: string,
  ): Promise<{ message: string }> {
    await this.productsService.delete(
      requester.organizationId,
      productId,
    );

    return {
      message: 'Product has been deleted successfully.',
    };
  }

  private toResponse(product: Product): ProductResponseDto {
    return {
      id: product.id,
      organizationId: product.organizationId,
      branchId: product.branchId,
      name: product.name,
      category: product.category,
      stock: product.stock,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
