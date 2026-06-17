"use client";

import { TABS, TabId } from "@/lib/tabs";

export default function TabNav({
  active,
  onChange,
}: {
  active: TabId;
  onChange: (id: TabId) => void;
}) {
  return (
    <nav className="-mx-1 max-w-full overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="inline-flex items-center gap-1 rounded-full border border-line bg-white/50 p-1 shadow-soft backdrop-blur-md">
        {TABS.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              aria-current={isActive ? "page" : undefined}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                isActive
                  ? "bg-white font-medium text-ink shadow-soft"
                  : "text-ink-soft hover:bg-white/50 hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
