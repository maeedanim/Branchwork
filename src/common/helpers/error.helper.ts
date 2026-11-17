
import {
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

interface PostgresDriverError {
  code?: string;
}

export function throwDatabaseError(error: unknown): never {
  if (!(error instanceof QueryFailedError)) {
    throw error;
  }

  const driverError =
    error.driverError as PostgresDriverError;

  switch (driverError.code) {
    case '23505':
      throw new ConflictException('Resource already exists.');

    case '23503':
      throw new ConflictException('Resource is still in use.');

    case '22P02':
      throw new BadRequestException('Invalid identifier.');

    case '22003':
      throw new BadRequestException('Numeric value is out of range.');

    default:
      throw error;
  }
}
