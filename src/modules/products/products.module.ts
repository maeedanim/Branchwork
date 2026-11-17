
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Product } from '../../schemas/Product.schema';
import { BranchesModule } from '../branches/branches.module';

import { ProductsController } from './products.controller';
import { ProductsRepository } from './products.repository';
import { ProductsService } from './products.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product]),
    BranchesModule,
  ],
  controllers: [ProductsController],
  providers: [
    ProductsRepository,
    ProductsService,
  ],
  exports: [ProductsService],
})
export class ProductsModule {}
