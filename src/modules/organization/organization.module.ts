
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Organization } from '../../schemas/Organization.schema';
import { OrganizationController } from './organization.controller';
import { OrganizationRepository } from './organization.repository';
import { OrganizationService } from './organization.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization]),
  ],
  controllers: [OrganizationController],
  providers: [
    OrganizationRepository,
    OrganizationService,
  ],
  exports: [OrganizationService],
})
export class OrganizationModule {}
