import { ProtectedPortalPage } from "@/components/access/protected-portal-page";
import { EmployeesTable } from "@/components/hrm/employees-table";
import { RESOURCES } from "@/lib/rbac/resources";

export default function HrmPage() {
  return <ProtectedPortalPage resource={RESOURCES.HRM}><EmployeesTable /></ProtectedPortalPage>;
}
