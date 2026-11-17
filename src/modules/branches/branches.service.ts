import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

import { Branch } from '../../schemas/Branch.schema';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { BranchesRepository } from './branches.repository';

interface PostgresError {
  code?: string;
  constraint?: string;
}

@Injectable()
export class BranchesService {
  constructor(
    private readonly branchesRepository: BranchesRepository,
  ) {}

  async create(
    organizationId: string,
    dto: CreateBranchDto,
  ): Promise<Branch> {
    try {
      return await this.branchesRepository.create(
        organizationId,
        dto.name,
      );
    } catch (error: unknown) {
      this.handleDatabaseError(error);
      throw error;
    }
  }

  async findAll(organizationId: string): Promise<Branch[]> {
    return this.branchesRepository.findAll(organizationId);
  }

  async findById(
    organizationId: string,
    branchId: string,
  ): Promise<Branch> {
    const branch = await this.branchesRepository.findById(
      organizationId,
      branchId,
    );

    if (!branch) {
      throw new NotFoundException('Branch not found.');
    }

    return branch;
  }

  async update(
    organizationId: string,
    branchId: string,
    dto: UpdateBranchDto,
  ): Promise<Branch> {
    if (dto.name === undefined) {
      throw new ConflictException(
        'At least one field must be provided.',
      );
    }

    const branch = await this.findById(
      organizationId,
      branchId,
    );

    try {
      return await this.branchesRepository.update(
        branch,
        dto.name,
      );
    } catch (error: unknown) {
      this.handleDatabaseError(error);
      throw error;
    }
  }

  async delete(
    organizationId: string,
    branchId: string,
  ): Promise<void> {
    await this.findById(organizationId, branchId);

    try {
      await this.branchesRepository.delete(
        organizationId,
        branchId,
      );
    } catch (error: unknown) {
      this.handleDatabaseError(error);
      throw error;
    }
  }

  private handleDatabaseError(error: unknown): void {
    if (!(error instanceof QueryFailedError)) {
      return;
    }

    const databaseError =
      error.driverError as PostgresError;

    if (databaseError.code === '23505') {
      throw new ConflictException(
        'A branch with this name already exists.',
      );
    }

    if (databaseError.code === '23503') {
      throw new ConflictException(
        'This branch is currently in use and cannot be deleted.',
      );
    }
  }
}