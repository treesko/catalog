export const ACCESS = {
  ADMIN: 1,
  MANAGER: 2,
  SELLER: 3,
} as const;

export function canManageProducts(access: number): boolean {
  return access <= ACCESS.MANAGER;
}

export function canManageUsers(access: number): boolean {
  return access <= ACCESS.ADMIN;
}
