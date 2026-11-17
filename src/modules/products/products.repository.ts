
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Product } from '../../schemas/Product.schema';
import type { PaginationParams } from '../../common/interfaces/pagination.interface';

@Injectable()
export class ProductsRepository {
  constructor(
    @InjectRepository(Product)
    private readonly repository: Repository<Product>,
  ) {}

  async create(
    organizationId: string,
    branchId: string,
    name: string,
    category: string | null,
    stock: number,
  ): Promise<Product> {
    const product = this.repository.create({
      organizationId,
      branchId,
      name,
      category,
      stock,
    });

    return this.repository.save(product);
  }

  async findAll(
    organizationId: string,
    pagination: PaginationParams,
    branchId?: string,
  ): Promise<[Product[], number]> {
    const query = this.repository
      .createQueryBuilder('product')
      .where('product.organizationId = :organizationId', {
        organizationId,
      });

    if (branchId !== undefined) {
      query.andWhere('product.branchId = :branchId', {
        branchId,
      });
    }

    return query
      .orderBy('product.createdAt', 'ASC')
      .addOrderBy('product.id', 'ASC')
      .skip((pagination.page - 1) * pagination.limit)
      .take(pagination.limit)
      .getManyAndCount();
  }

  async findById(
    organizationId: string,
    productId: string,
    branchId?: string,
  ): Promise<Product | null> {
    const query = this.repository
      .createQueryBuilder('product')
      .where('product.id = :productId', {
        productId,
      })
      .andWhere('product.organizationId = :organizationId', {
        organizationId,
      });

    if (branchId !== undefined) {
      query.andWhere('product.branchId = :branchId', {
        branchId,
      });
    }

    return query.getOne();
  }

  async update(
    product: Product,
    updates: Partial<Pick<Product, 'category' | 'stock' | 'branchId'>>,
  ): Promise<Product> {
    Object.assign(product, updates);

    return this.repository.save(product);
  }

  async delete(
    organizationId: string,
    productId: string,
  ): Promise<void> {
    await this.repository.delete({
      id: productId,
      organizationId,
    });
  }
}
