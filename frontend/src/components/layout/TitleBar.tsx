"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, PanelLeft, Plus, User } from "lucide-react";

const TABS = [
  { label: "Ask", href: "/ask" },
  { label: "Agents", href: "/agents" },
  { label: "Tasks", href: "/tasks" },
];

export function TitleBar() {
  const pathname = usePathname();

  return (
    <header className="h-[52px] bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] flex items-center justify-between px-4 shrink-0">
      {/* Left: sidebar toggle + nav arrows */}
      <div className="flex items-center gap-3">
        <button className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] p-1">
          <PanelLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-1">
          <button className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] p-1">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] p-1">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center: Tab navigation */}
      <nav className="flex items-center gap-1">
        {TABS.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[13px] font-medium transition-colors",
                isActive
                  ? "bg-[var(--bg-hover)] text-white font-semibold"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {/* Right: New chat + avatar */}
      <div className="flex items-center gap-2">
        <button className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] p-1">
          <Plus className="w-4 h-4" />
        </button>
        <button className="w-7 h-7 rounded-full bg-[var(--bg-hover)] flex items-center justify-center">
          <User className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
        </button>
      </div>
    </header>
  );
}
