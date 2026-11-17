
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Organization } from './Organization.schema';
import { Branch } from './Branch.schema';

@Entity({ name: 'products' })
@Index('IDX_products_organization_branch', [
  'organizationId',
  'branchId',
])
@Check(
  'CHK_products_stock_non_negative',
  '"stock" >= 0',
)
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @ManyToOne(() => Organization, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId!: string;

  @ManyToOne(() => Branch, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'branch_id' })
  branch!: Branch;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  category!: string | null;

  @Column({
    type: 'integer',
    default: 0,
  })
  stock!: number;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
  })
  updatedAt!: Date;
}
