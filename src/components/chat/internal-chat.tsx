"use client";

import { MessageCircle, Search, Send } from "lucide-react";
import { useMemo, useState } from "react";

const people = [
  { id: "usr-001", name: "Aisha Rahman", designation: "HR Manager", online: true },
  { id: "usr-002", name: "Rohan Menon", designation: "Senior Accountant", online: true },
  { id: "usr-003", name: "Sara Khan", designation: "Key Account Manager", online: false },
  { id: "usr-004", name: "Daniel George", designation: "UI/UX Designer", online: true },
  { id: "usr-005", name: "Maya Thomas", designation: "Marketing Specialist", online: false },
] as const;

type Person = (typeof people)[number];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function InternalChat() {
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [query, setQuery] = useState("");

  const filteredPeople = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return people;
    }

    return people.filter((person) =>
      `${person.name} ${person.designation}`.toLowerCase().includes(normalizedQuery),
    );
  }, [query]);

  return (
    <section className="col-span-12 min-w-0">
      <div className="grid h-[calc(100dvh-7.75rem)] min-h-[480px] grid-cols-[96px_minmax(0,1fr)] overflow-hidden rounded-2xl bg-white shadow-[0_12px_32px_rgba(15,23,42,0.06)] ring-1 ring-slate-100 sm:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col border-r border-slate-100">
          <div className="border-b border-slate-100 p-3 sm:p-4">
            <h2 className="text-center text-sm font-semibold text-slate-700 sm:text-left">
              People
            </h2>
            <label className="relative mt-3 hidden sm:block">
              <span className="sr-only">Search people</span>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
                strokeWidth={1.8}
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search people"
                className="h-9 w-full rounded-xl bg-slate-50 pr-3 pl-9 text-xs text-slate-700 outline-none ring-1 ring-slate-100 transition focus:ring-2 focus:ring-emerald-200"
              />
            </label>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2 sm:p-2.5">
            {filteredPeople.map((person) => {
              const isSelected = selectedPerson?.id === person.id;

              return (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => setSelectedPerson(person)}
                  aria-pressed={isSelected}
                  title={person.name}
                  className={`mb-1 flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl p-2 text-left transition-colors sm:justify-start ${
                    isSelected
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="relative grid size-10 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                    {getInitials(person.name)}
                    <span
                      className={`absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-white ${
                        person.online ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                    />
                  </span>
                  <span className="hidden min-w-0 sm:block">
                    <span className="block truncate text-sm font-semibold">{person.name}</span>
                    <span className="mt-0.5 block truncate text-xs text-slate-400">
                      {person.designation}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="flex min-w-0 flex-col bg-[#FCFDFC] dark:bg-[#152238]">
          {selectedPerson ? (
            <>
              <header className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-100 bg-white px-4">
                <span className="relative grid size-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700">
                  {getInitials(selectedPerson.name)}
                  <span
                    className={`absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-white ${
                      selectedPerson.online ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                  />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-slate-700">
                    {selectedPerson.name}
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {selectedPerson.online ? "Online" : "Offline"}
                  </p>
                </div>
              </header>

              <div className="grid min-h-0 flex-1 place-items-center p-6 text-center">
                <div>
                  <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-500">
                    <MessageCircle aria-hidden="true" className="size-6" strokeWidth={1.6} />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-slate-700">No messages yet</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Start a conversation with {selectedPerson.name.split(" ")[0]}.
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2 border-t border-slate-100 bg-white p-3 sm:p-4">
                <input
                  type="text"
                  aria-label={`Message ${selectedPerson.name}`}
                  placeholder="Type a message..."
                  className="h-10 min-w-0 flex-1 rounded-xl bg-slate-50 px-3 text-sm text-slate-700 outline-none ring-1 ring-slate-100 transition focus:ring-2 focus:ring-emerald-200"
                />
                <button
                  type="button"
                  aria-label="Send message"
                  className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl bg-emerald-500 text-white transition-colors hover:bg-emerald-600"
                >
                  <Send aria-hidden="true" className="size-[18px]" strokeWidth={1.8} />
                </button>
              </div>
            </>
          ) : (
            <div className="grid h-full place-items-center p-6 text-center">
              <div>
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-400">
                  <MessageCircle aria-hidden="true" className="size-7" strokeWidth={1.5} />
                </span>
                <h2 className="mt-4 font-semibold text-slate-700">No conversation selected</h2>
                <p className="mt-1 max-w-xs text-sm leading-relaxed text-slate-400">
                  Choose a person from the left to open a conversation.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
