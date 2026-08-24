"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { DashboardGrid } from "@/components/layout/dashboard-grid";
import { TopNavigation } from "@/components/layout/top-navigation";
import { WelcomeHeader } from "@/components/layout/welcome-header";

type DashboardShellProps = {
  children?: ReactNode;
  canAccessAdminConsole: boolean;
  currentUser: {
    displayName: string;
    username: string | null;
  };
};

export function DashboardShell({
  children,
  canAccessAdminConsole,
  currentUser,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const showWelcomeHeader = pathname === "/dashboard";

  useEffect(() => {
    if (!isSidebarExpanded) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSidebarExpanded(false);
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isSidebarExpanded]);

  return (
    <div className="relative flex h-dvh w-full overflow-hidden bg-[#FAFCFB] dark:bg-[#101a2c]">
      <div className="relative z-30 w-16 shrink-0 sm:w-20">
        <AppSidebar
          canAccessAdminConsole={canAccessAdminConsole}
          currentUser={currentUser}
          isExpanded={isSidebarExpanded}
          onNavigate={() => setIsSidebarExpanded(false)}
        />
      </div>
      {isSidebarExpanded ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setIsSidebarExpanded(false)}
          className="absolute inset-y-0 right-0 left-16 z-20 cursor-default bg-slate-900/10 backdrop-blur-[1px] sm:left-20"
        />
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNavigation
          isSidebarExpanded={isSidebarExpanded}
          onMenuToggle={() => setIsSidebarExpanded((isExpanded) => !isExpanded)}
        />
        {showWelcomeHeader ? <WelcomeHeader /> : null}
        <DashboardGrid hasWelcomeHeader={showWelcomeHeader}>{children}</DashboardGrid>
      </div>
    </div>
  );
}
