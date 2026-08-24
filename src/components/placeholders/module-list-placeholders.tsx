"use client";

import {
  BadgeDollarSign,
  BriefcaseBusiness,
  ContactRound,
  Handshake,
} from "lucide-react";

import {
  type DataTableColumn,
  IdentityCell,
  SearchableDataTable,
  TablePill,
} from "@/components/shared/searchable-data-table";

const crmRecords = [
  { id: "CRM-101", client: "Northstar Retail", activity: "Renewal discussion", owner: "Sara Khan", lastContact: "18 Aug 2026", status: "Follow-up" },
  { id: "CRM-102", client: "Brightline Studios", activity: "Proposal shared", owner: "Leena Mathew", lastContact: "16 Aug 2026", status: "In progress" },
  { id: "CRM-103", client: "Cedar Health Group", activity: "Quarterly review", owner: "Ayaan Joseph", lastContact: "12 Aug 2026", status: "Scheduled" },
] as const;

type CrmRecord = (typeof crmRecords)[number];

const crmColumns: readonly DataTableColumn<CrmRecord>[] = [
  { id: "id", header: "CRM ID", cell: (row) => row.id, cellClassName: "font-mono text-xs font-medium text-slate-400" },
  { id: "client", header: "Client", cell: (row) => <IdentityCell name={row.client} /> },
  { id: "activity", header: "Latest activity", cell: (row) => row.activity, cellClassName: "text-sm text-slate-600" },
  { id: "owner", header: "Owner", cell: (row) => row.owner, cellClassName: "text-sm text-slate-600" },
  { id: "lastContact", header: "Last contact", cell: (row) => row.lastContact, cellClassName: "text-sm whitespace-nowrap text-slate-500" },
  { id: "status", header: "Status", cell: (row) => <TablePill>{row.status}</TablePill> },
];

const vendors = [
  { id: "VEN-201", name: "Atlas Office Supplies", category: "Office supplies", contact: "Nikhil Das", country: "India", status: "Active" },
  { id: "VEN-202", name: "Nova IT Services", category: "Technology", contact: "Aarav Shah", country: "United Arab Emirates", status: "Under review" },
  { id: "VEN-203", name: "BluePeak Printing", category: "Print and media", contact: "Zara Khan", country: "Qatar", status: "Active" },
] as const;

type Vendor = (typeof vendors)[number];

const vendorColumns: readonly DataTableColumn<Vendor>[] = [
  { id: "id", header: "Vendor ID", cell: (row) => row.id, cellClassName: "font-mono text-xs font-medium text-slate-400" },
  { id: "name", header: "Vendor", cell: (row) => <IdentityCell name={row.name} /> },
  { id: "category", header: "Category", cell: (row) => <TablePill>{row.category}</TablePill> },
  { id: "contact", header: "Contact person", cell: (row) => row.contact, cellClassName: "text-sm text-slate-600" },
  { id: "country", header: "Country", cell: (row) => row.country, cellClassName: "text-sm text-slate-600" },
  { id: "status", header: "Status", cell: (row) => row.status, cellClassName: "text-sm text-slate-500" },
];

const businessRecords = [
  { id: "BMS-301", client: "Meridian Logistics", service: "Monthly operations review", owner: "Omar Farooq", updated: "20 Aug 2026", status: "Open" },
  { id: "BMS-302", client: "Canvas Hospitality", service: "Compliance follow-up", owner: "Aisha Rahman", updated: "17 Aug 2026", status: "In progress" },
  { id: "BMS-303", client: "Greenfield Technologies", service: "Service renewal", owner: "Sara Khan", updated: "11 Aug 2026", status: "Pending" },
] as const;

type BusinessRecord = (typeof businessRecords)[number];

const businessColumns: readonly DataTableColumn<BusinessRecord>[] = [
  { id: "id", header: "Record ID", cell: (row) => row.id, cellClassName: "font-mono text-xs font-medium text-slate-400" },
  { id: "client", header: "Client", cell: (row) => <IdentityCell name={row.client} /> },
  { id: "service", header: "Service", cell: (row) => row.service, cellClassName: "text-sm text-slate-600" },
  { id: "owner", header: "Owner", cell: (row) => row.owner, cellClassName: "text-sm text-slate-600" },
  { id: "updated", header: "Updated", cell: (row) => row.updated, cellClassName: "text-sm whitespace-nowrap text-slate-500" },
  { id: "status", header: "Status", cell: (row) => <TablePill>{row.status}</TablePill> },
];

const accountEntries = [
  { id: "ACC-401", type: "Invoice", client: "Northstar Retail", reference: "INV-2026-081", amount: "₹1,85,000", date: "21 Aug 2026", status: "Due" },
  { id: "ACC-402", type: "Estimate", client: "Cedar Health Group", reference: "EST-2026-044", amount: "₹92,500", date: "19 Aug 2026", status: "Sent" },
  { id: "ACC-403", type: "Bill", client: "Brightline Studios", reference: "BILL-2026-119", amount: "₹48,200", date: "14 Aug 2026", status: "Paid" },
] as const;

type AccountEntry = (typeof accountEntries)[number];

const accountColumns: readonly DataTableColumn<AccountEntry>[] = [
  { id: "id", header: "Entry ID", cell: (row) => row.id, cellClassName: "font-mono text-xs font-medium text-slate-400" },
  { id: "type", header: "Type", cell: (row) => <TablePill>{row.type}</TablePill> },
  { id: "client", header: "Client", cell: (row) => <IdentityCell name={row.client} /> },
  { id: "reference", header: "Reference", cell: (row) => row.reference, cellClassName: "font-mono text-xs text-slate-500" },
  { id: "amount", header: "Amount", cell: (row) => row.amount, cellClassName: "text-sm font-semibold whitespace-nowrap text-slate-700" },
  { id: "date", header: "Date", cell: (row) => row.date, cellClassName: "text-sm whitespace-nowrap text-slate-500" },
  { id: "status", header: "Status", cell: (row) => row.status, cellClassName: "text-sm text-slate-500" },
];

export function CrmPlaceholder() {
  return (
    <SearchableDataTable
      rows={crmRecords}
      columns={crmColumns}
      getRowKey={(row) => row.id}
      getSearchText={(row) => Object.values(row).join(" ")}
      searchLabel="Search CRM records"
      searchPlaceholder="Search clients, activities or owners..."
      itemLabel="record"
      countIcon={ContactRound}
      emptyTitle="No CRM records found"
      emptyDescription="Try a different client, activity, or owner."
      tableClassName="min-w-[940px]"
    />
  );
}

export function VmsPlaceholder() {
  return (
    <SearchableDataTable
      rows={vendors}
      columns={vendorColumns}
      getRowKey={(row) => row.id}
      getSearchText={(row) => Object.values(row).join(" ")}
      searchLabel="Search vendors"
      searchPlaceholder="Search vendor ID, name, category or contact..."
      itemLabel="vendor"
      countIcon={Handshake}
      emptyTitle="No vendors found"
      emptyDescription="Try a different vendor, category, or contact."
      tableClassName="min-w-[940px]"
    />
  );
}

export function BmsPlaceholder() {
  return (
    <SearchableDataTable
      rows={businessRecords}
      columns={businessColumns}
      getRowKey={(row) => row.id}
      getSearchText={(row) => Object.values(row).join(" ")}
      searchLabel="Search business records"
      searchPlaceholder="Search clients, services or owners..."
      itemLabel="record"
      countIcon={BriefcaseBusiness}
      emptyTitle="No business records found"
      emptyDescription="Try a different client, service, or owner."
      tableClassName="min-w-[940px]"
    />
  );
}

export function AccountsPlaceholder() {
  return (
    <SearchableDataTable
      rows={accountEntries}
      columns={accountColumns}
      getRowKey={(row) => row.id}
      getSearchText={(row) => Object.values(row).join(" ")}
      searchLabel="Search account entries"
      searchPlaceholder="Search entry, client, reference or status..."
      itemLabel="entry"
      itemLabelPlural="entries"
      countIcon={BadgeDollarSign}
      emptyTitle="No account entries found"
      emptyDescription="Try a different entry, client, or reference."
      tableClassName="min-w-[1040px]"
    />
  );
}
