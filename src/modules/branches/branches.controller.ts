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
  ApiTags,
} from '@nestjs/swagger';

import { GetUser } from '../../common/request-metadata/getUser.decorator';
import type { RequestUser } from '../../common/interfaces/request-user.interface';
import { OwnerOnly } from '../auth/decorators/auth.decorator';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { BranchResponseDto } from './dto/branch-response.dto';

@ApiTags('Branches')
@ApiBearerAuth()
@OwnerOnly()
@Controller('branches')
export class BranchesController {
  constructor(
    private readonly branchesService: BranchesService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a branch' })
  async create(
    @GetUser() user: RequestUser,
    @Body() dto: CreateBranchDto,
  ): Promise<BranchResponseDto> {
    return this.branchesService.create(
      user.organizationId,
      dto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List organization branches' })
  async findAll(
    @GetUser() user: RequestUser,
  ): Promise<BranchResponseDto[]> {
    return this.branchesService.findAll(
      user.organizationId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a branch' })
  async findById(
    @GetUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) branchId: string,
  ): Promise<BranchResponseDto> {
    return this.branchesService.findById(
      user.organizationId,
      branchId,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a branch' })
  async update(
    @GetUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) branchId: string,
    @Body() dto: UpdateBranchDto,
  ): Promise<BranchResponseDto> {
    return this.branchesService.update(
      user.organizationId,
      branchId,
      dto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a branch' })
  async delete(
    @GetUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) branchId: string,
  ): Promise<void> {
    await this.branchesService.delete(
      user.organizationId,
      branchId,
    );
  }
}