
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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { GetUser } from '../../common/request-metadata/getUser.decorator';
import type { RequestUser } from '../../common/interfaces/request-user.interface';
import { PERMISSIONS } from '../../common/constants/permissions.constants';

import { OwnerOnly } from '../auth/decorators/auth.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { BranchResponseDto } from './dto/branch-response.dto';

@ApiTags('Branches')
@ApiBearerAuth()
@Controller('branches')
export class BranchesController {
  constructor(
    private readonly branchesService: BranchesService,
  ) {}

  @Post()
  @OwnerOnly()
  @ApiOperation({ summary: 'Create a branch' })
  @ApiResponse({
    status: 201,
    description: 'Branch created successfully.',
    type: BranchResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Authentication required.' })
  @ApiResponse({ status: 403, description: 'Owner access required.' })
  @ApiResponse({ status: 409, description: 'Branch name already exists.' })
  async create(
    @GetUser() user: RequestUser,
    @Body() dto: CreateBranchDto,
  ): Promise<BranchResponseDto> {
    const branch = await this.branchesService.create(
      user.organizationId,
      dto,
    );

    return {
      id: branch.id,
      name: branch.name,
      organizationId: branch.organizationId,
      createdAt: branch.createdAt,
      updatedAt: branch.updatedAt,
    };
  }

  @Get()
  @RequirePermissions(PERMISSIONS.BRANCH_VIEW)
  @ApiOperation({ summary: 'Get all branches in the organization' })
  @ApiResponse({
    status: 200,
    description: 'Branches retrieved successfully.',
    type: [BranchResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Authentication required.' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions.' })
  async findAll(
    @GetUser() user: RequestUser,
  ): Promise<BranchResponseDto[]> {
    const branches = await this.branchesService.findAll(
      user.organizationId,
    );

    return branches.map((branch) => ({
      id: branch.id,
      name: branch.name,
      organizationId: branch.organizationId,
      createdAt: branch.createdAt,
      updatedAt: branch.updatedAt,
    }));
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.BRANCH_VIEW)
  @ApiOperation({ summary: 'Get a branch by ID' })
  @ApiResponse({
    status: 200,
    description: 'Branch retrieved successfully.',
    type: BranchResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Authentication required.' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions.' })
  @ApiResponse({ status: 404, description: 'Branch not found.' })
  async findById(
    @GetUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) branchId: string,
  ): Promise<BranchResponseDto> {
    const branch = await this.branchesService.findById(
      user.organizationId,
      branchId,
    );

    return {
      id: branch.id,
      name: branch.name,
      organizationId: branch.organizationId,
      createdAt: branch.createdAt,
      updatedAt: branch.updatedAt,
    };
  }

  @Patch(':id')
  @OwnerOnly()
  @ApiOperation({ summary: 'Update a branch' })
  @ApiResponse({
    status: 200,
    description: 'Branch updated successfully.',
    type: BranchResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid update request.' })
  @ApiResponse({ status: 401, description: 'Authentication required.' })
  @ApiResponse({ status: 403, description: 'Owner access required.' })
  @ApiResponse({ status: 404, description: 'Branch not found.' })
  @ApiResponse({ status: 409, description: 'Branch name already exists.' })
  async update(
    @GetUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) branchId: string,
    @Body() dto: UpdateBranchDto,
  ): Promise<BranchResponseDto> {
    const branch = await this.branchesService.update(
      user.organizationId,
      branchId,
      dto,
    );

    return {
      id: branch.id,
      name: branch.name,
      organizationId: branch.organizationId,
      createdAt: branch.createdAt,
      updatedAt: branch.updatedAt,
    };
  }

  @Delete(':id')
  @OwnerOnly()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a branch' })
  @ApiResponse({
    status: 200,
    description: 'Branch deleted successfully.',
  })
  @ApiResponse({ status: 401, description: 'Authentication required.' })
  @ApiResponse({ status: 403, description: 'Owner access required.' })
  @ApiResponse({ status: 404, description: 'Branch not found.' })
  @ApiResponse({
    status: 409,
    description: 'Branch is currently in use and cannot be deleted.',
  })
  async delete(
    @GetUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) branchId: string,
  ): Promise<{ message: string }> {
    await this.branchesService.delete(
      user.organizationId,
      branchId,
    );

    return {
      message: 'Branch has been deleted successfully.',
    };
  }
}
