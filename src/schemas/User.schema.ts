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
import { Role } from './Role.schema';

export type UserType = 'OWNER' | 'STAFF';

@Entity({ name: 'users' })
@Index('UQ_users_email', ['email'], { unique: true })
@Index('IDX_users_organization_branch', [
  'organizationId',
  'branchId',
])
@Check(
  'CHK_users_valid_type_assignment',
  `(
    ("user_type" = 'OWNER' AND "branch_id" IS NULL AND "role_id" IS NULL)
    OR
    ("user_type" = 'STAFF' AND "branch_id" IS NOT NULL AND "role_id" IS NOT NULL)
  )`,
)
@Check(
  'CHK_users_email_lowercase',
  '"email" = lower("email")',
)
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @ManyToOne(() => Organization, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: 255,
    select: false,
  })
  passwordHash!: string;

  @Column({
    name: 'user_type',
    type: 'varchar',
    length: 10,
  })
  userType!: UserType;

  @Column({
    name: 'branch_id',
    type: 'uuid',
    nullable: true,
  })
  branchId!: string | null;

  @ManyToOne(() => Branch, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'branch_id' })
  branch!: Branch | null;

  @Column({
    name: 'role_id',
    type: 'uuid',
    nullable: true,
  })
  roleId!: string | null;

  @ManyToOne(() => Role, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'role_id' })
  role!: Role | null;

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