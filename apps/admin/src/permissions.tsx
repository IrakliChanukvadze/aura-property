import type { ReactNode } from "react";
export type Permission = "crm" | "content" | "workspace";
export function hasPermission(user: any, permission: Permission) {
  if (!user?.active) return false;
  if (permission === "content")
    return user.role === "SUPER_ADMIN" || user.contentEdit === true;
  if (permission === "crm")
    return ["SUPER_ADMIN", "TEAM_LEAD", "AGENT"].includes(user.role);
  return true;
}
export function PermissionComponent({
  user,
  permission,
  children,
}: {
  user: any;
  permission: Permission;
  children: ReactNode;
}) {
  return hasPermission(user, permission) ? <>{children}</> : null;
}
export function pagePermission(page: number): Permission {
  return [6, 7, 9].includes(page) ? "content" : page <= 3 ? "crm" : "workspace";
}
