import { ShieldX } from "lucide-react";

type AccessDeniedProps = {
  title?: string;
  description?: string;
};

export function AccessDenied({
  title = "Access denied",
  description = "You do not have permission to view this page.",
}: AccessDeniedProps) {
  return (
    <section className="col-span-12 grid min-h-72 place-items-center">
      <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-[0_12px_32px_rgba(15,23,42,0.06)] ring-1 ring-slate-100">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-rose-50 text-rose-600">
          <ShieldX aria-hidden="true" className="size-6" strokeWidth={1.8} />
        </span>
        <h2 className="mt-5 text-lg font-semibold text-slate-800">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </section>
  );
}
