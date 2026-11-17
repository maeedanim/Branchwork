import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Branch } from '../../schemas/Branch.schema';
import { BranchesController } from './branches.controller';
import { BranchesRepository } from './branches.repository';
import { BranchesService } from './branches.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Branch]),
  ],
  controllers: [BranchesController],
  providers: [
    BranchesRepository,
    BranchesService,
  ],
  exports: [BranchesService],
})
export class BranchesModule {}