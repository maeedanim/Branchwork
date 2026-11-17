
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
  ApiTags,
} from '@nestjs/swagger';

import { GetUser } from '../../common/request-metadata/getUser.decorator';
import type { RequestUser } from '../../common/interfaces/request-user.interface';
import type { PaginatedResult } from '../../common/interfaces/pagination.interface';
import { PERMISSIONS } from '../../common/constants/permissions.constants';

import {
  OwnerOnly,
} from '../auth/decorators/auth.decorator';
import {
  RequirePermissions,
} from '../auth/decorators/permissions.decorator';

import { UsersService } from './users.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { StaffQueryDto } from './dto/staff-query.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { User } from '../../schemas/User.schema';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @OwnerOnly()
  @ApiOperation({ summary: 'Create a staff member' })
  async createStaff(
    @GetUser() requester: RequestUser,
    @Body() dto: CreateStaffDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.createStaff(
      requester.organizationId,
      dto,
    );

    return this.toResponse(user);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.STAFF_VIEW)
  @ApiOperation({ summary: 'Get paginated staff members' })
  async findAllStaff(
    @GetUser() requester: RequestUser,
    @Query() query: StaffQueryDto,
  ): Promise<PaginatedResult<UserResponseDto>> {
    const result = await this.usersService.findAllStaff(
      requester,
      {
        page: query.page,
        limit: query.limit,
      },
    );

    return {
      items: result.items.map((user) => this.toResponse(user)),
      meta: result.meta,
    };
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.STAFF_VIEW)
  @ApiOperation({ summary: 'Get a staff member by ID' })
  async findStaffById(
    @GetUser() requester: RequestUser,
    @Param('id', ParseUUIDPipe) userId: string,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.findStaffById(
      requester,
      userId,
    );

    return this.toResponse(user);
  }

  @Patch(':id')
  @OwnerOnly()
  @ApiOperation({ summary: 'Update a staff member' })
  async updateStaff(
    @GetUser() requester: RequestUser,
    @Param('id', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateStaffDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.updateStaff(
      requester.organizationId,
      userId,
      dto,
    );

    return this.toResponse(user);
  }

  
@Delete(':id')
@OwnerOnly()
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Delete a staff member' })
async deleteStaff(
  @GetUser() requester: RequestUser,
  @Param('id', ParseUUIDPipe) userId: string,
): Promise<{ message: string }> {
  await this.usersService.deleteStaff(
    requester.organizationId,
    userId,
  );

  return {
    message: 'Staff member has been deleted successfully.',
  };
}


  private toResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      organizationId: user.organizationId,
      name: user.name,
      email: user.email,
      userType: user.userType,
      branchId: user.branchId,
      roleId: user.roleId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
