"use client";

import { useState } from "react";
import { QuickLink } from "@/lib/types";
import Card from "@/components/Card";

/** Prepend https:// when the user omits a scheme. */
function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function LinksWidget({
  links,
  onChange,
}: {
  links: QuickLink[];
  onChange: (links: QuickLink[]) => void;
}) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");

  function add() {
    const cleanUrl = normalizeUrl(url);
    if (!cleanUrl) return;
    onChange([
      ...links,
      {
        id: crypto.randomUUID(),
        label: label.trim() || hostname(cleanUrl),
        url: cleanUrl,
      },
    ]);
    setLabel("");
    setUrl("");
  }

  function remove(id: string) {
    onChange(links.filter((l) => l.id !== id));
  }

  return (
    <Card title="Quick Links">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label (optional)"
          className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-gray-500 focus:border-gray-500 sm:w-1/3"
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="example.com"
          className="flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-gray-500 focus:border-gray-500"
        />
        <button
          onClick={add}
          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
        >
          Add
        </button>
      </div>

      {links.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">
          No links yet — save your go-to sites.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {links.map((link) => (
            <div
              key={link.id}
              className="group relative flex items-center rounded-lg border border-border bg-surface-2 p-3 transition hover:border-gray-500"
            >
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1"
              >
                <span className="block truncate text-sm font-medium text-gray-100">
                  {link.label}
                </span>
                <span className="block truncate text-xs text-gray-500">
                  {hostname(link.url)}
                </span>
              </a>
              <button
                onClick={() => remove(link.id)}
                className="absolute right-1.5 top-1.5 text-gray-600 opacity-0 transition hover:text-red-400 group-hover:opacity-100"
                aria-label="Delete link"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
