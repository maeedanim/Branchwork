
export type UserType = 'OWNER' | 'STAFF';

export interface RequestUser {
  id: string;
  organizationId: string;
  userType: UserType;
  branchId: string | null;
  roleId: string | null;
}
