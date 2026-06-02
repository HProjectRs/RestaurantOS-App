import { useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { ROLE_HIERARCHY } from '../constants/roles';

const PERMISSIONS_MATRIX = {
  ADMIN: { access: true, edit: true, delete: true, create: true },
  MANAGER: { access: true, edit: true, delete: false, create: true },
  CASHIER: { access: true, edit: false, delete: false, create: false },
  WAITER: { access: true, edit: false, delete: false, create: true },
  CHEF: { access: true, edit: false, delete: false, create: false },
};

export function usePermissions(requiredRole = null) {
  const user = useAuthStore((s) => s.user);

  return useMemo(() => {
    if (!user) return { canAccess: false, canEdit: false, canDelete: false, canCreate: false };

    const userRole = user.role;
    const perms = PERMISSIONS_MATRIX[userRole] || { access: false, edit: false, delete: false, create: false };

    if (!requiredRole) return { ...perms, canAccess: perms.access };

    const userLevel = ROLE_HIERARCHY[userRole] ?? 0;
    const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? 0;

    return {
      canAccess: perms.access && userLevel >= requiredLevel,
      canEdit: perms.edit && userLevel >= requiredLevel,
      canDelete: perms.delete && userLevel >= requiredLevel,
      canCreate: perms.create && userLevel >= requiredLevel,
    };
  }, [user, requiredRole]);
}
