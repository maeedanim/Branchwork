import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Role } from '../../schemas/Role.schema';

import { RbacRepository } from './rbac.repository';
import { RbacService } from './rbac.service';
import { RbacAdminService } from './rbac-admin.service';
import { RbacAdminController } from './rbac-admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Role])],
  controllers: [RbacAdminController],
  providers: [
    RbacRepository,
    RbacService,
    RbacAdminService,
  ],
  exports: [
    RbacService,
    RbacAdminService,
  ],
})
export class RbacModule {}