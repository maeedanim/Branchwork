
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../../schemas/User.schema';
import { CommonModule } from '../../common/common.module';

import { BranchesModule } from '../branches/branches.module';
import { RbacModule } from '../auth/rbac.module';

import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    CommonModule,
    BranchesModule,
    RbacModule,
  ],
  controllers: [UsersController],
  providers: [UsersRepository, UsersService],
  exports: [UsersService],
})
export class UsersModule {}
