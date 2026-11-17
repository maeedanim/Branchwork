
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

import { Product } from '../../schemas/Product.schema';
import type { RequestUser } from '../../common/interfaces/request-user.interface';
import type {
  PaginationParams,
  PaginatedResult,
} from '../../common/interfaces/pagination.interface';

import { BranchesService } from '../branches/branches.service';

import { ProductsRepository } from './products.repository';
import { CreateProductDto } from './dto/create-product.dto';
import { OrganizeProductDto } from './dto/organize-product.dto';

interface PostgresError {
  code?: string;
}

@Injectable()
export class ProductsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly branchesService: BranchesService,
  ) {}

  async create(
    organizationId: string,
    dto: CreateProductDto,
  ): Promise<Product> {
    this.validateRequiredId(organizationId, 'Organization ID');
    this.validateRequiredId(dto.branchId, 'Branch ID');

    await this.branchesService.findById(
      organizationId,
      dto.branchId,
    );

    try {
      return await this.productsRepository.create(
        organizationId,
        dto.branchId,
        dto.name,
        dto.category ?? null,
        dto.stock,
      );
    } catch (error: unknown) {
      this.handleDatabaseError(error);
      throw error;
    }
  }

  async findAll(
    requester: RequestUser,
    pagination: PaginationParams,
    requestedBranchId?: string,
  ): Promise<PaginatedResult<Product>> {
    this.validateRequiredId(
      requester.organizationId,
      'Organization ID',
    );

    let branchId: string | undefined;

    if (requester.userType === 'STAFF') {
      if (!requester.branchId) {
        throw new ForbiddenException(
          'Your account is not assigned to a branch.',
        );
      }

      // STAFF can only see products in their own branch.
      // Ignore any branchId supplied in the query.
      branchId = requester.branchId;
    } else if (requestedBranchId !== undefined) {
      // OWNER may filter by a branch within their organization.
      await this.branchesService.findById(
        requester.organizationId,
        requestedBranchId,
      );

      branchId = requestedBranchId;
    }

    const [items, total] =
      await this.productsRepository.findAll(
        requester.organizationId,
        pagination,
        branchId,
      );

    return {
      items,
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  async findById(
    requester: RequestUser,
    productId: string,
  ): Promise<Product> {
    this.validateRequiredId(
      requester.organizationId,
      'Organization ID',
    );
    this.validateRequiredId(productId, 'Product ID');

    let branchId: string | undefined;

    if (requester.userType === 'STAFF') {
      if (!requester.branchId) {
        throw new ForbiddenException(
          'Your account is not assigned to a branch.',
        );
      }

      branchId = requester.branchId;
    }

    const product = await this.productsRepository.findById(
      requester.organizationId,
      productId,
      branchId,
    );

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    return product;
  }

  async organize(
    requester: RequestUser,
    productId: string,
    dto: OrganizeProductDto,
  ): Promise<Product> {
    this.validateRequiredId(
      requester.organizationId,
      'Organization ID',
    );
    this.validateRequiredId(productId, 'Product ID');

    if (
      dto.category === undefined &&
      dto.stock === undefined &&
      dto.branchId === undefined
    ) {
      throw new BadRequestException(
        'At least one field must be provided.',
      );
    }

    // First enforce tenant and STAFF branch visibility.
    const product = await this.findById(
      requester,
      productId,
    );

    // Validate the destination branch if the product is moving.
    if (dto.branchId !== undefined) {
      await this.branchesService.findById(
        requester.organizationId,
        dto.branchId,
      );
    }

    const updates: Partial<
      Pick<Product, 'category' | 'stock' | 'branchId'>
    > = {};

    if (dto.category !== undefined) {
      updates.category = dto.category;
    }

    if (dto.stock !== undefined) {
      updates.stock = dto.stock;
    }

    if (dto.branchId !== undefined) {
      updates.branchId = dto.branchId;
    }

    try {
      return await this.productsRepository.update(
        product,
        updates,
      );
    } catch (error: unknown) {
      this.handleDatabaseError(error);
      throw error;
    }
  }

  async delete(
    organizationId: string,
    productId: string,
  ): Promise<void> {
    this.validateRequiredId(organizationId, 'Organization ID');
    this.validateRequiredId(productId, 'Product ID');

    const product = await this.productsRepository.findById(
      organizationId,
      productId,
    );

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    try {
      await this.productsRepository.delete(
        organizationId,
        productId,
      );
    } catch (error: unknown) {
      this.handleDatabaseError(error);
      throw error;
    }
  }

  private validateRequiredId(
    value: string | null | undefined,
    fieldName: string,
  ): void {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(
        `${fieldName} is required.`,
      );
    }
  }

  private handleDatabaseError(error: unknown): void {
    if (!(error instanceof QueryFailedError)) {
      return;
    }

    const databaseError =
      error.driverError as PostgresError | undefined;

    switch (databaseError?.code) {
      case '23503':
        throw new ConflictException(
          'This product is currently in use and cannot be modified or deleted.',
        );

      case '23505':
        throw new ConflictException(
          'A database constraint was violated.',
        );

      case '22P02':
        throw new BadRequestException(
          'Invalid identifier.',
        );

      case '22003':
        throw new BadRequestException(
          'Numeric value is out of range.',
        );
    }
  }
}
