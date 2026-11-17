
import { ApiProperty } from '@nestjs/swagger';

export class ProductResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  organizationId!: string;

  @ApiProperty({ format: 'uuid' })
  branchId!: string;

  @ApiProperty({ example: 'Wireless Mouse' })
  name!: string;

  @ApiProperty({
    example: 'Electronics',
    nullable: true,
  })
  category!: string | null;

  @ApiProperty({ example: 100 })
  stock!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
