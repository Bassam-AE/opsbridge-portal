import {
  BookOpenText,
  FileImage,
  FileText,
  Images,
  Newspaper,
  PenLine,
} from "lucide-react";

const contentTypes = [
  { name: "Posts", description: "Social and campaign posts", icon: Newspaper },
  { name: "Blogs", description: "Long-form articles and drafts", icon: BookOpenText },
  { name: "Flyers", description: "Promotional one-page designs", icon: FileImage },
  { name: "Brochures", description: "Multi-page marketing collateral", icon: FileText },
  { name: "Image Assets", description: "Approved visual assets", icon: Images },
  { name: "Content", description: "Copy, notes, and content ideas", icon: PenLine },
] as const;

export function MarketingPlaceholder() {
  return (
    <section className="col-span-12 min-w-0">
      <div className="rounded-2xl bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.06)] ring-1 ring-slate-100 sm:p-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="font-semibold text-slate-800">Content library</h2>
            <p className="mt-1 text-xs text-slate-400">Marketing workspace placeholder</p>
          </div>
          <span className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700">
            Draft layout
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 pt-5 sm:grid-cols-2 xl:grid-cols-3">
          {contentTypes.map(({ name, description, icon: Icon }) => (
            <div key={name} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
              <span className="grid size-10 place-items-center rounded-xl bg-white text-emerald-600 shadow-sm">
                <Icon aria-hidden="true" className="size-5" strokeWidth={1.8} />
              </span>
              <h3 className="mt-5 text-sm font-semibold text-slate-700">{name}</h3>
              <p className="mt-1 text-xs text-slate-400">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
