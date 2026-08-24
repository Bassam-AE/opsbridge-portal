import type { ReactNode } from "react";

type DashboardGridProps = {
  children?: ReactNode;
  hasWelcomeHeader?: boolean;
};

export function DashboardGrid({ children, hasWelcomeHeader = false }: DashboardGridProps) {
  return (
    <main
      className={`min-h-0 flex-1 overflow-y-auto px-4 pb-5 md:px-8 md:pb-8 ${
        hasWelcomeHeader ? "pt-1 md:pt-2" : "pt-4 md:pt-6"
      }`}
    >
      <section
        aria-label="Dashboard widgets"
        className="grid min-h-[420px] grid-cols-12 gap-6"
      >
        {children}
      </section>
    </main>
  );
}
