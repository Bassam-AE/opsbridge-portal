"use client";

import { Building2 } from "lucide-react";

import {
  type DataTableColumn,
  IdentityCell,
  SearchableDataTable,
  TablePill,
} from "@/components/shared/searchable-data-table";
import type { ClientListItem } from "@/services/clients";

const columns: readonly DataTableColumn<ClientListItem>[] = [
  {
    id: "id",
    header: "Client ID",
    cell: (client) => client.clientCode,
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
      <span className="grid size-8 place-items-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
        {client.countryCode}
      </span>
    ),
  },
  {
    id: "type",
    header: "Type",
    cell: (client) => <TablePill>{client.clientType}</TablePill>,
  },
  {
    id: "status",
    header: "Status",
    cell: (client) => <TablePill>{client.status}</TablePill>,
    cellClassName: "capitalize",
  },
  {
    id: "created",
    header: "Client since",
    cell: (client) => client.createdAt.slice(0, 10),
    cellClassName: "text-sm whitespace-nowrap text-slate-500",
  },
];

export function ClientsTable({ clients }: { clients: readonly ClientListItem[] }) {
  return (
    <SearchableDataTable
      rows={clients}
      columns={columns}
      getRowKey={(client) => client.id}
      getRowHref={(client) => `/clients/${client.id}`}
      getSearchText={(client) =>
        [
          client.clientCode,
          client.name,
          client.countryCode,
          client.clientType,
          client.status,
        ].join(" ")
      }
      searchLabel="Search clients"
      searchPlaceholder="Search by client ID, name, country, type, or status..."
      itemLabel="client"
      countIcon={Building2}
      emptyTitle="No clients available"
      emptyDescription="Only active client companies assigned to you appear here."
      tableClassName="min-w-[820px]"
    />
  );
}
