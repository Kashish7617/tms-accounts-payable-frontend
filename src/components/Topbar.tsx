import { Bell, HelpCircle, Search } from "lucide-react";
import type { ReactNode } from "react";

interface TopbarProps {
  title: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  actions?: ReactNode;
}

export default function Topbar({ title, searchPlaceholder, searchValue, onSearchChange, actions }: TopbarProps) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
      <h1 className="whitespace-nowrap text-lg font-semibold text-slate-900">{title}</h1>

      {searchPlaceholder !== undefined && (
        <div className="relative w-full max-w-md">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchValue ?? ""}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
      )}

      <div className="flex items-center gap-3">
        <button type="button" aria-label="Notifications" className="rounded-full p-2 text-slate-500 hover:bg-slate-50">
          <Bell size={18} />
        </button>
        <button type="button" aria-label="Help" className="rounded-full p-2 text-slate-500 hover:bg-slate-50">
          <HelpCircle size={18} />
        </button>
        {actions}
      </div>
    </header>
  );
}
