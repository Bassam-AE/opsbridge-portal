export function WelcomeHeader() {
  return (
    <section className="flex shrink-0 flex-col justify-between gap-4 px-4 py-4 md:flex-row md:items-center md:px-8 md:py-5">
      <div className="flex min-w-0 items-center gap-3.5">
        <div className="relative grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-amber-200 via-orange-200 to-rose-200 text-xs font-bold text-slate-700 shadow-sm sm:size-12">
          EK
          <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-[#FAFCFB] bg-emerald-500" />
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold tracking-[-0.01em] text-slate-800 sm:text-base">
            Welcome back, Erik Kovalsky
          </h2>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-400 sm:text-sm">
            We&apos;re very happy to see you again on your personal dashboard.
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2.5 pl-[58px] md:pl-0">
        <button
          type="button"
          className="cursor-pointer rounded-xl border border-slate-200 bg-white/70 px-4 py-2 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:border-slate-300 hover:bg-white sm:text-sm"
        >
          View Reports
        </button>
        <button
          type="button"
          className="cursor-pointer rounded-xl bg-emerald-500 px-5 py-2 text-xs font-semibold text-white shadow-[0_8px_20px_rgba(16,185,129,0.25)] transition-colors hover:bg-emerald-600 sm:text-sm"
        >
          Manage Store
        </button>
      </div>
    </section>
  );
}
