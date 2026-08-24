"use client";

import { UsersRound } from "lucide-react";

import {
  type DataTableColumn,
  IdentityCell,
  SearchableDataTable,
  TablePill,
} from "@/components/shared/searchable-data-table";

const employees = [
  { id: "EMP-001", name: "Aisha Rahman", designation: "HR Manager", joinedOn: "12 Mar 2019", joinedOnIso: "2019-03-12", dateOfBirth: "19 Jul 1990", dateOfBirthIso: "1990-07-19" },
  { id: "EMP-002", name: "Rohan Menon", designation: "Senior Accountant", joinedOn: "08 Nov 2020", joinedOnIso: "2020-11-08", dateOfBirth: "02 Feb 1988", dateOfBirthIso: "1988-02-02" },
  { id: "EMP-003", name: "Sara Khan", designation: "Key Account Manager", joinedOn: "21 Jun 2021", joinedOnIso: "2021-06-21", dateOfBirth: "14 Dec 1993", dateOfBirthIso: "1993-12-14" },
  { id: "EMP-004", name: "Daniel George", designation: "UI/UX Designer", joinedOn: "04 Apr 2022", joinedOnIso: "2022-04-04", dateOfBirth: "28 Sep 1995", dateOfBirthIso: "1995-09-28" },
  { id: "EMP-005", name: "Maya Thomas", designation: "Marketing Specialist", joinedOn: "17 Jan 2023", joinedOnIso: "2023-01-17", dateOfBirth: "05 May 1997", dateOfBirthIso: "1997-05-05" },
  { id: "EMP-006", name: "Omar Farooq", designation: "Vendor Manager", joinedOn: "09 Oct 2023", joinedOnIso: "2023-10-09", dateOfBirth: "23 Mar 1992", dateOfBirthIso: "1992-03-23" },
] as const;

type Employee = (typeof employees)[number];

const columns: readonly DataTableColumn<Employee>[] = [
  {
    id: "id",
    header: "Employee ID",
    cell: (employee) => employee.id,
    cellClassName: "font-mono text-xs font-medium text-slate-400",
  },
  { id: "name", header: "Name", cell: (employee) => <IdentityCell name={employee.name} /> },
  {
    id: "designation",
    header: "Designation",
    cell: (employee) => <TablePill>{employee.designation}</TablePill>,
  },
  {
    id: "joinedOn",
    header: "Date of joining",
    cell: (employee) => <time dateTime={employee.joinedOnIso}>{employee.joinedOn}</time>,
    cellClassName: "text-sm whitespace-nowrap text-slate-600",
  },
  {
    id: "dateOfBirth",
    header: "DOB",
    cell: (employee) => (
      <time dateTime={employee.dateOfBirthIso}>{employee.dateOfBirth}</time>
    ),
    cellClassName: "text-sm whitespace-nowrap text-slate-500",
  },
];

export function EmployeesTable() {
  return (
    <SearchableDataTable
      rows={employees}
      columns={columns}
      getRowKey={(employee) => employee.id}
      getSearchText={(employee) => Object.values(employee).join(" ")}
      searchLabel="Search employees"
      searchPlaceholder="Search by employee ID, name or designation..."
      itemLabel="employee"
      countIcon={UsersRound}
      emptyTitle="No employees found"
      emptyDescription="Try a different employee ID, name, or designation."
      tableClassName="min-w-[820px]"
    />
  );
}
