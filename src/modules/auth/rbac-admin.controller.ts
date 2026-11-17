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
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { OwnerOnly } from './decorators/auth.decorator';
import { GetUser } from '../../common/request-metadata/getUser.decorator';
import type { RequestUser } from '../../common/interfaces/request-user.interface';

import { RbacAdminService } from './rbac-admin.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleResponseDto } from './dto/role-response.dto';

@ApiTags('Roles')
@ApiBearerAuth()
@OwnerOnly()
@Controller('roles')
export class RbacAdminController {
  constructor(
    private readonly rbacAdminService: RbacAdminService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a role' })
  @ApiCreatedResponse({ type: RoleResponseDto })
  async createRole(
    @GetUser() user: RequestUser,
    @Body() dto: CreateRoleDto,
  ): Promise<RoleResponseDto> {
    return this.rbacAdminService.createRole(
      user.organizationId,
      dto,
    );
  }

  @Get('permissions')
  @ApiOperation({ summary: 'Get the available permission catalog' })
  @ApiOkResponse({ schema: { type: 'array', items: { type: 'string' } } })
  getPermissionCatalog(): string[] {
    return this.rbacAdminService.getPermissionCatalog();
  }

  @Get()
  @ApiOperation({ summary: 'Get all organization roles' })
  @ApiOkResponse({ type: RoleResponseDto, isArray: true })
  async findAllRoles(
    @GetUser() user: RequestUser,
  ): Promise<RoleResponseDto[]> {
    return this.rbacAdminService.findAllRoles(user.organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a role by ID' })
  @ApiOkResponse({ type: RoleResponseDto })
  async findRole(
    @GetUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) roleId: string,
  ): Promise<RoleResponseDto> {
    return this.rbacAdminService.findRole(
      user.organizationId,
      roleId,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a role' })
  @ApiOkResponse({ type: RoleResponseDto })
  async updateRole(
    @GetUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) roleId: string,
    @Body() dto: UpdateRoleDto,
  ): Promise<RoleResponseDto> {
    return this.rbacAdminService.updateRole(
      user.organizationId,
      roleId,
      dto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a role' })
  @ApiOkResponse({
    schema: {
      example: { message: 'Role deleted successfully.' },
    },
  })
  async deleteRole(
    @GetUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) roleId: string,
  ): Promise<{ message: string }> {
    await this.rbacAdminService.deleteRole(
      user.organizationId,
      roleId,
    );

    return { message: 'Role deleted successfully.' };
  }
}