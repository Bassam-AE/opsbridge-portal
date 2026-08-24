import {
  ArrowDownAZ,
  FileText,
  Folder,
  FolderOpen,
  Grid2X2,
  MoreVertical,
} from "lucide-react";

const folders = [
  { name: "Documents", description: "Company and client documents", accent: "bg-blue-50 text-blue-600" },
  { name: "Receipts", description: "Purchase and expense receipts", accent: "bg-amber-50 text-amber-600" },
  { name: "Certificates", description: "Licenses and certificates", accent: "bg-violet-50 text-violet-600" },
  { name: "Bills", description: "Bills and payment records", accent: "bg-emerald-50 text-emerald-600" },
] as const;

export function VaultBrowser() {
  return (
    <section className="col-span-12 min-w-0">
      <div className="min-h-[440px] rounded-2xl bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.06)] ring-1 ring-slate-100 sm:p-5 lg:p-6">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <FolderOpen aria-hidden="true" className="size-5" strokeWidth={1.8} />
            </span>
            <div>
              <h2 className="font-semibold text-slate-800">My Vault</h2>
              <p className="mt-0.5 text-xs text-slate-400">Secure client files and records</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Sort folders"
              className="grid size-9 cursor-pointer place-items-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <ArrowDownAZ aria-hidden="true" className="size-[18px]" strokeWidth={1.8} />
            </button>
            <button
              type="button"
              aria-label="Grid view"
              aria-pressed="true"
              className="grid size-9 cursor-pointer place-items-center rounded-xl bg-emerald-50 text-emerald-600"
            >
              <Grid2X2 aria-hidden="true" className="size-[18px]" strokeWidth={1.8} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 py-5 text-sm text-slate-400">
          <FileText aria-hidden="true" className="size-4" strokeWidth={1.8} />
          <span>All files</span>
          <span aria-hidden="true">/</span>
          <span className="font-medium text-slate-700">Folders</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {folders.map((folder) => (
            <button
              key={folder.name}
              type="button"
              aria-label={`Open ${folder.name} folder`}
              className="group flex min-h-32 cursor-pointer flex-col justify-between rounded-2xl bg-slate-50 p-4 text-left ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]"
            >
              <div className="flex items-start justify-between">
                <span className={`grid size-11 place-items-center rounded-xl ${folder.accent}`}>
                  <Folder
                    aria-hidden="true"
                    className="size-6 fill-current/15"
                    strokeWidth={1.7}
                  />
                </span>
                <span className="grid size-8 place-items-center rounded-lg text-slate-300 transition-colors group-hover:bg-slate-100 group-hover:text-slate-500">
                  <MoreVertical aria-hidden="true" className="size-4" />
                </span>
              </div>
              <div className="mt-5">
                <h3 className="text-sm font-semibold text-slate-700">{folder.name}</h3>
                <p className="mt-1 truncate text-xs text-slate-400">{folder.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
