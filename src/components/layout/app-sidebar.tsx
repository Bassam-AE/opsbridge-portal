"use client";

import { ChevronsLeft, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { portalNavigation } from "@/components/layout/portal-navigation";

type AppSidebarProps = {
  canAccessAdminConsole: boolean;
  currentUser: {
    displayName: string;
    username: string | null;
  };
  isExpanded: boolean;
  onNavigate: () => void;
};

function getInitials(displayName: string) {
  return displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function AppSidebar({
  canAccessAdminConsole,
  currentUser,
  isExpanded,
  onNavigate,
}: AppSidebarProps) {
  const pathname = usePathname();
  const visibleNavigation = portalNavigation.filter(
    ({ href }) => href !== "/admin" || canAccessAdminConsole,
  );

  return (
    <aside
      id="portal-sidebar"
      className={`absolute inset-y-0 left-0 z-30 flex flex-col overflow-hidden border-r border-slate-100 py-5 transition-[width,box-shadow,background-color] duration-300 ease-out sm:py-7 ${
        isExpanded
          ? "w-64 bg-white shadow-[18px_0_44px_rgba(15,23,42,0.12)]"
          : "w-16 bg-white sm:w-20"
      }`}
    >
      <div className="flex h-11 w-full shrink-0 items-center">
        <Link
          href="/dashboard"
          aria-label="Service Operations Portal"
          onClick={onNavigate}
          className={`flex h-11 min-w-0 items-center ${isExpanded ? "flex-1" : "w-full"}`}
        >
          <span className="grid w-16 shrink-0 place-items-center sm:w-20">
            <span className="grid size-10 place-items-center rounded-[14px] bg-emerald-50 sm:size-11">
              <span className="grid size-7 place-items-center bg-emerald-500 [clip-path:polygon(50%_0%,100%_82%,82%_100%,18%_100%,0%_82%)] sm:size-8">
                <span className="mt-1 size-2 rounded-full bg-white" />
              </span>
            </span>
          </span>
          {isExpanded ? (
            <span className="truncate whitespace-nowrap pr-2 text-sm font-bold tracking-[-0.02em] text-slate-800">
              My Company
            </span>
          ) : null}
        </Link>
        {isExpanded ? (
          <button
            type="button"
            aria-label="Collapse navigation"
            onClick={onNavigate}
            className="mr-3 grid size-9 shrink-0 cursor-pointer place-items-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-emerald-600"
          >
            <ChevronsLeft aria-hidden="true" className="size-[18px]" strokeWidth={1.8} />
          </button>
        ) : null}
      </div>

      <nav
        aria-label="Primary navigation"
        className="my-4 flex min-h-0 w-full flex-1 overflow-x-hidden overflow-y-auto sm:my-5"
      >
        <div className="my-auto flex w-full flex-col gap-1.5 py-1">
          {visibleNavigation.map(({ label, href, icon: Icon }) => {
            const isActive =
              pathname === href || (href === "/admin" && pathname.startsWith("/admin/"));

            return (
              <div key={href} className="relative w-full shrink-0">
                <Link
                  href={href}
                  onClick={onNavigate}
                  aria-label={label}
                  aria-current={isActive ? "page" : undefined}
                  title={isExpanded ? undefined : label}
                  className={`group mx-3 flex h-10 w-[calc(100%-1.5rem)] cursor-pointer items-center rounded-xl transition-colors ${
                    isActive
                      ? isExpanded
                        ? "bg-emerald-500 text-white shadow-[0_8px_18px_rgba(16,185,129,0.28)]"
                        : "text-white"
                      : isExpanded
                        ? "text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
                        : "text-slate-400 hover:text-emerald-600"
                  }`}
                >
                  <span className="grid w-10 shrink-0 place-items-center sm:w-14">
                    <span
                      className={`grid size-10 place-items-center rounded-xl transition-colors ${
                        !isExpanded && isActive
                          ? "bg-emerald-500 shadow-[0_8px_18px_rgba(16,185,129,0.28)]"
                          : !isExpanded
                            ? "group-hover:bg-emerald-50"
                            : ""
                      }`}
                    >
                      <Icon
                        aria-hidden="true"
                        strokeWidth={1.8}
                        className="size-[18px] shrink-0"
                      />
                    </span>
                  </span>
                  {isExpanded ? (
                    <span className="whitespace-nowrap text-sm font-medium">{label}</span>
                  ) : null}
                </Link>
                {isActive ? (
                  <span className="absolute top-1/2 right-0 h-5 w-1 -translate-y-1/2 rounded-l-full bg-emerald-500" />
                ) : null}
              </div>
            );
          })}
        </div>
      </nav>

      <div className="flex w-full shrink-0 flex-col gap-2">
        <form action="/api/auth/logout" method="post" className="w-full">
          <button
            type="submit"
            title={isExpanded ? undefined : "Sign out"}
            aria-label="Sign out"
            className={`mx-3 flex h-10 w-[calc(100%-1.5rem)] cursor-pointer items-center rounded-xl text-rose-600 transition-colors hover:bg-rose-100 ${
              isExpanded ? "bg-rose-50" : ""
            }`}
          >
            <span className="grid w-10 shrink-0 place-items-center sm:w-14">
              <span
                className={`grid size-10 place-items-center rounded-xl ${
                  isExpanded ? "" : "bg-rose-50"
                }`}
              >
                <LogOut aria-hidden="true" className="size-[17px] shrink-0" strokeWidth={1.8} />
              </span>
            </span>
            {isExpanded ? <span className="text-sm font-medium">Sign out</span> : null}
          </button>
        </form>

        <div className="mx-3 flex h-10 w-[calc(100%-1.5rem)] items-center rounded-xl">
          <span className="grid w-10 shrink-0 place-items-center sm:w-14">
            <span className="relative grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-[11px] font-semibold tracking-wide text-white shadow-sm sm:size-10">
              {getInitials(currentUser.displayName)}
              <span className="absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-white bg-emerald-500" />
            </span>
          </span>
          {isExpanded ? (
            <span className="min-w-0 text-left">
              <span className="block truncate text-sm font-semibold text-slate-700">
                {currentUser.displayName}
              </span>
              <span className="block truncate text-xs text-slate-400">
                {currentUser.username ?? "Signed in"}
              </span>
            </span>
          ) : null}
        </div>
      </div>
    </aside>
  );
}