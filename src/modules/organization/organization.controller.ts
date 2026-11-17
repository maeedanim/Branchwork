
import {
  Controller,
  Get,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { GetUser } from '../../common/request-metadata/getUser.decorator';
import type { RequestUser } from '../../common/interfaces/request-user.interface';
import { Authenticated } from '../auth/decorators/auth.decorator';
import { OrganizationResponseDto } from './dto/organization-response.dto';
import { OrganizationService } from './organization.service';

@ApiTags('Organization')
@ApiBearerAuth()
@Controller('organization')
export class OrganizationController {
  constructor(
    private readonly organizationService: OrganizationService,
  ) {}

  @Get('me')
  @Authenticated()
  @ApiOperation({
    summary: 'Get the current organization',
  })
  @ApiResponse({
    status: 200,
    description: 'Organization retrieved successfully',
    type: OrganizationResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
  })
  @ApiResponse({
    status: 404,
    description: 'Organization not found',
  })
  async findCurrent(
    @GetUser() user: RequestUser,
  ): Promise<OrganizationResponseDto> {
    const organization =
      await this.organizationService.findById(user.organizationId);

    return {
      id: organization.id,
      name: organization.name,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
    };
  }
}
