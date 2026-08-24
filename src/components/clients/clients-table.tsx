"use client";

import { UsersRound } from "lucide-react";

import {
  type DataTableColumn,
  IdentityCell,
  SearchableDataTable,
  TablePill,
} from "@/components/shared/searchable-data-table";

const clients = [
  { id: "CL-1001", name: "Northstar Retail", country: "United Arab Emirates", countryCode: "AE", type: "Retail", kam: "Leena Mathew", spoc: "Omar Rahman", userSince: "Jan 2022" },
  { id: "CL-1002", name: "Brightline Studios", country: "India", countryCode: "IN", type: "Creative Agency", kam: "Nadia Khan", spoc: "Rohit Menon", userSince: "May 2022" },
  { id: "CL-1003", name: "Cedar Health Group", country: "Saudi Arabia", countryCode: "SA", type: "Healthcare", kam: "Ayaan Joseph", spoc: "Sara Al-Harbi", userSince: "Nov 2022" },
  { id: "CL-1004", name: "Meridian Logistics", country: "Qatar", countryCode: "QA", type: "Logistics", kam: "Leena Mathew", spoc: "Faris Ahmed", userSince: "Mar 2023" },
  { id: "CL-1005", name: "Canvas Hospitality", country: "Bahrain", countryCode: "BH", type: "Hospitality", kam: "Nadia Khan", spoc: "Maya Thomas", userSince: "Sep 2023" },
  { id: "CL-1006", name: "Greenfield Technologies", country: "Singapore", countryCode: "SG", type: "Technology", kam: "Ayaan Joseph", spoc: "Daniel Lim", userSince: "Feb 2024" },
] as const;

type Client = (typeof clients)[number];

const columns: readonly DataTableColumn<Client>[] = [
  {
    id: "id",
    header: "Client ID",
    cell: (client) => client.id,
    cellClassName: "font-mono text-xs font-medium text-slate-400",
  },
  {
    id: "name",
    header: "Client name",
    cell: (client) => <IdentityCell name={client.name} />,
  },
  {
    id: "country",
    header: "Country",
    cell: (client) => (
      <span className="flex items-center gap-2 text-sm text-slate-600">
        <span className="grid size-7 place-items-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
          {client.countryCode}
        </span>
        {client.country}
      </span>
    ),
  },
  { id: "type", header: "Type", cell: (client) => <TablePill>{client.type}</TablePill> },
  { id: "kam", header: "KAM", cell: (client) => client.kam, cellClassName: "text-sm text-slate-600" },
  { id: "spoc", header: "SPOC", cell: (client) => client.spoc, cellClassName: "text-sm text-slate-600" },
  { id: "userSince", header: "User since", cell: (client) => client.userSince, cellClassName: "text-sm whitespace-nowrap text-slate-500" },
];

export function ClientsTable() {
  return (
    <SearchableDataTable
      rows={clients}
      columns={columns}
      getRowKey={(client) => client.id}
      getSearchText={(client) => Object.values(client).join(" ")}
      searchLabel="Search clients"
      searchPlaceholder="Search by client ID, name, country, KAM or SPOC..."
      itemLabel="client"
      countIcon={UsersRound}
      emptyTitle="No clients found"
      emptyDescription="Try a different name, ID, or contact."
      tableClassName="min-w-[1040px]"
    />
  );
}
