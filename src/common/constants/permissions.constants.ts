
export const PERMISSIONS = {
  PRODUCT_VIEW: 'product.view',
  PRODUCT_ORGANIZE: 'product.organize',
  BRANCH_VIEW: 'branch.view',
  STAFF_VIEW: 'staff.view',
} as const;

export type Permission =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSION_CATALOG: Permission[] = Object.values(PERMISSIONS);
