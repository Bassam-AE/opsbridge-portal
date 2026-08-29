"use client";

import { ArrowLeft, Building2, Clock3, Menu, Moon, Sun, UsersRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

import { getPortalPageTitle } from "@/components/layout/portal-navigation";
import { returnToProviderPortalAction } from "@/app/(portal)/context-actions";
import type { ClientContextOption } from "@/lib/client-context";

const utilityButtonClass =
  "relative grid size-9 cursor-pointer place-items-center rounded-xl text-slate-500 transition-colors hover:bg-emerald-50 hover:text-emerald-600";

const themeChangeEvent = "portal-theme-change";

function subscribeToTheme(onStoreChange: () => void) {
  window.addEventListener(themeChangeEvent, onStoreChange);
  return () => window.removeEventListener(themeChangeEvent, onStoreChange);
}

function getThemeSnapshot() {
  return document.documentElement.classList.contains("dark");
}

function getServerThemeSnapshot() {
  return false;
}

type TopNavigationProps = {
  accountType: "internal" | "client";
  clientContexts: ClientContextOption[];
  currentClientId: string | null;
  canManageCompanyUsers: boolean;
  isSidebarExpanded: boolean;
  onMenuToggle: () => void;
};

export function TopNavigation({
  accountType,
  clientContexts,
  currentClientId,
  canManageCompanyUsers,
  isSidebarExpanded,
  onMenuToggle,
}: TopNavigationProps) {
  const pathname = usePathname();
  const pageTitle = getPortalPageTitle(pathname);
  const isDarkMode = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );
  const [now, setNow] = useState<Date | null>(null);
  const currentClient = clientContexts.find(({ id }) => id === currentClientId);

  useEffect(() => {
    const initialClock = window.setTimeout(() => setNow(new Date()), 0);
    const clock = window.setInterval(() => setNow(new Date()), 1_000);
    return () => {
      window.clearTimeout(initialClock);
      window.clearInterval(clock);
    };
  }, []);

  function toggleColorMode() {
    const nextIsDark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", nextIsDark);
    document.documentElement.style.colorScheme = nextIsDark ? "dark" : "light";
    window.localStorage.setItem("portal-theme", nextIsDark ? "dark" : "light");
    window.dispatchEvent(new Event(themeChangeEvent));
  }

  const dateLabel = now
    ? new Intl.DateTimeFormat(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(now)
    : "—";
  const timeLabel = now
    ? new Intl.DateTimeFormat(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(now)
    : "—";

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100/80 px-4 md:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          aria-label="Toggle navigation"
          aria-controls="portal-sidebar"
          aria-expanded={isSidebarExpanded}
          onClick={onMenuToggle}
          className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors hover:bg-emerald-100"
        >
          <Menu aria-hidden="true" className="size-5" strokeWidth={2} />
        </button>
        <h1 className="truncate text-lg font-bold tracking-[-0.02em] text-slate-800 sm:text-xl">
          {pageTitle}
        </h1>
        {accountType === "internal" && !currentClient ? (
          <div
            aria-label="Provider context: Blindly Digital"
            className="hidden h-10 items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm lg:flex"
          >
            <Building2 aria-hidden="true" className="size-4 text-emerald-500" strokeWidth={1.8} />
            Blindly Digital
          </div>
        ) : null}
        {currentClient ? (
          <div className="hidden items-center gap-2 lg:flex">
            <div
              aria-label={`Current company: ${currentClient.name}`}
              className="flex h-10 items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm"
            >
              <Building2 aria-hidden="true" className="size-4 text-emerald-500" strokeWidth={1.8} />
              <span className="max-w-48 truncate">{currentClient.name}</span>
            </div>
            {accountType === "internal" ? (
              <form action={returnToProviderPortalAction}>
                <button
                  type="submit"
                  className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-emerald-200 hover:text-emerald-600"
                >
                  <ArrowLeft aria-hidden="true" className="size-4" />
                  Blindly Digital
                </button>
              </form>
            ) : canManageCompanyUsers ? (
              <Link
                href="/company/users"
                className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-emerald-200 hover:text-emerald-600"
              >
                <UsersRound aria-hidden="true" className="size-4" />
                Company users
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-0.5 sm:gap-1.5">
        {accountType === "internal" && currentClient ? (
          <form action={returnToProviderPortalAction} className="lg:hidden">
            <button
              type="submit"
              aria-label="Return to Blindly Digital portal"
              className={utilityButtonClass}
            >
              <ArrowLeft aria-hidden="true" className="size-[18px]" strokeWidth={1.8} />
            </button>
          </form>
        ) : null}
        {accountType === "client" && canManageCompanyUsers ? (
          <Link
            href="/company/users"
            aria-label="Company users"
            className={`${utilityButtonClass} lg:hidden`}
          >
            <UsersRound aria-hidden="true" className="size-[18px]" strokeWidth={1.8} />
          </Link>
        ) : null}
        <button
          type="button"
          aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          aria-pressed={isDarkMode}
          onClick={toggleColorMode}
          className={utilityButtonClass}
        >
          {isDarkMode ? (
            <Sun aria-hidden="true" className="size-[18px]" strokeWidth={1.8} />
          ) : (
            <Moon aria-hidden="true" className="size-[18px]" strokeWidth={1.8} />
          )}
        </button>

        <time
          dateTime={now?.toISOString()}
          className="flex h-10 items-center gap-2 rounded-xl border border-slate-100 bg-white px-2.5 text-slate-500 shadow-sm sm:min-w-40 sm:px-3"
        >
          <Clock3 aria-hidden="true" className="size-4 shrink-0 text-emerald-500" strokeWidth={1.8} />
          <span className="min-w-0 leading-tight">
            <span className="hidden whitespace-nowrap text-[11px] font-medium text-slate-400 sm:block">
              {dateLabel}
            </span>
            <span className="block whitespace-nowrap text-xs font-semibold text-slate-600">
              {timeLabel}
            </span>
          </span>
        </time>
      </div>
    </header>
  );
}
