/**
 * Admin RBAC — the single source of truth for both the backend PermissionsGuard
 * and the admin console's menu/route gating. Roles are *data*: to add a role add
 * an `AdminRole` member + one `ROLE_PERMISSIONS` entry; to change a role's rules,
 * edit its permission array. (v2 can move the map into a DB table for runtime
 * editing — the PERMISSIONS catalog stays code-defined.)
 */

/** Sub-roles within UserRole.ADMIN. */
export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  OPS = 'OPS',
  SUPPORT = 'SUPPORT',
  FINANCE = 'FINANCE',
  READ_ONLY = 'READ_ONLY',
}

/** Granular `resource:action` permissions. Add new capabilities here. */
export const PERMISSIONS = [
  'dashboard:view',
  'fleet:view', // live map
  'riders:read',
  'riders:manage', // suspend / reactivate
  'drivers:read',
  'drivers:manage',
  'drivers:verify', // approve/reject KYC (NIN + liveness)
  'dedicated:read',
  'dedicated:onboard',
  'trips:read',
  'trips:override', // cancel / reassign an active trip
  'disputes:manage',
  'tickets:read',
  'tickets:manage',
  'finance:read',
  'finance:manage', // payouts, promos, fare config
  'admins:read',
  'admins:manage', // invite admins, assign roles
  'audit:read',
  'settings:manage',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/**
 * Role → permissions. SUPER_ADMIN gets everything; the rest are explicit so the
 * rules are obvious and easy to edit.
 */
export const ROLE_PERMISSIONS: Record<AdminRole, readonly Permission[]> = {
  [AdminRole.SUPER_ADMIN]: PERMISSIONS,

  [AdminRole.OPS]: [
    'dashboard:view',
    'fleet:view',
    'riders:read',
    'riders:manage',
    'drivers:read',
    'drivers:manage',
    'drivers:verify',
    'dedicated:read',
    'dedicated:onboard',
    'trips:read',
    'trips:override',
    'disputes:manage',
    'tickets:read',
    'tickets:manage',
  ],

  [AdminRole.SUPPORT]: [
    'dashboard:view',
    'fleet:view',
    'riders:read',
    'drivers:read',
    'trips:read',
    'disputes:manage',
    'tickets:read',
    'tickets:manage',
  ],

  [AdminRole.FINANCE]: ['dashboard:view', 'trips:read', 'finance:read', 'finance:manage'],

  [AdminRole.READ_ONLY]: [
    'dashboard:view',
    'fleet:view',
    'riders:read',
    'drivers:read',
    'dedicated:read',
    'trips:read',
    'tickets:read',
    'finance:read',
    'audit:read',
  ],
};

/** True if `role` is granted `permission`. */
export function hasPermission(
  role: AdminRole | null | undefined,
  permission: Permission,
): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/** All permissions for a role (empty if unknown). */
export function permissionsFor(role: AdminRole | null | undefined): readonly Permission[] {
  return role ? (ROLE_PERMISSIONS[role] ?? []) : [];
}
