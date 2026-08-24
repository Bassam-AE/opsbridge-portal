import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";

import { getCurrentSession } from "@/lib/auth/require-session";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [session, query] = await Promise.all([getCurrentSession(), searchParams]);

  if (session) {
    redirect("/dashboard");
  }

  const showError = query.error === "invalid_credentials";

  return (
    <main className="relative grid min-h-dvh w-full place-items-center overflow-hidden bg-[linear-gradient(145deg,#0F4A38_0%,#165B43_52%,#0B3D30_100%)] px-5 py-8">
      <div className="pointer-events-none absolute -top-32 -left-24 size-96 rounded-full bg-emerald-300/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 -bottom-36 size-[30rem] rounded-full bg-teal-200/10 blur-3xl" />

      <section className="relative w-full max-w-[440px] rounded-[30px] bg-[#FAFCFB] p-6 shadow-[0_30px_90px_rgba(2,22,16,0.35)] dark:bg-[#18253a] sm:p-9">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid size-11 place-items-center bg-emerald-500 [clip-path:polygon(50%_0%,100%_82%,82%_100%,18%_100%,0%_82%)]">
            <span className="mt-1 size-2.5 rounded-full bg-white" />
          </div>
          <div>
            <p className="font-bold tracking-[-0.02em] text-slate-800">Service Portal</p>
            <p className="text-xs text-slate-400">Secure administration access</p>
          </div>
        </div>

        <div className="mb-7">
          <div className="mb-4 grid size-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
            <ShieldCheck aria-hidden="true" className="size-5" strokeWidth={1.9} />
          </div>
          <h1 className="text-2xl font-bold tracking-[-0.03em] text-slate-900">Welcome back</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Sign in with the temporary local administrator account.
          </p>
        </div>

        {showError ? (
          <div role="alert" className="mb-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            The username or password is incorrect.
          </div>
        ) : null}

        <form action="/api/auth/login" method="post" className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Username</span>
            <input
              name="username"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              required
              placeholder="Enter your username"
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Password</span>
            <div className="relative">
              <LockKeyhole aria-hidden="true" className="absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-slate-400" strokeWidth={1.8} />
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="Enter your password"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white pr-4 pl-11 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              />
            </div>
          </label>

          <button
            type="submit"
            className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-500 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(16,185,129,0.24)] transition hover:bg-emerald-600"
          >
            Sign in
            <ArrowRight aria-hidden="true" className="size-4" strokeWidth={2} />
          </button>
        </form>

        <div className="mt-6 rounded-xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-xs leading-5 text-amber-800">
          Local development only: username <strong>admin</strong>, password <strong>admin</strong>.
        </div>
      </section>
    </main>
  );
}
