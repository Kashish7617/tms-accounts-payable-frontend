import type { ComponentType } from "react";
import {
  LayoutDashboard,
  Landmark,
  BookText,
  ArrowLeftRight,
  FileText,
  CreditCard,
  BarChart3,
  Settings,
  Boxes,
} from "lucide-react";

export type SidebarRoute =
  | "dashboard"
  | "accounts"
  | "ledger"
  // | "transactions"
  | "invoices"
  // | "payments"
  // | "reports"
  // | "settings";

interface SidebarProps {
  active: SidebarRoute;
  onNavigate: (route: SidebarRoute) => void;
  companyName?: string;
  companySubtitle?: string;
  userName?: string;
  userRole?: string;
}

const NAV_ITEMS: Array<{ route: SidebarRoute; label: string; icon: ComponentType<{ size?: number }> }> = [
  { route: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { route: "accounts", label: "Accounts", icon: Landmark },
  { route: "ledger", label: "Ledger", icon: BookText },
  // { route: "transactions", label: "Transactions", icon: ArrowLeftRight },
  { route: "invoices", label: "Invoices", icon: FileText },
  // { route: "payments", label: "Payments", icon: CreditCard },
  // { route: "reports", label: "Reports", icon: BarChart3 },
];

export default function Sidebar({
  active,
  onNavigate,
  companyName = "TMS Fintech",
  companySubtitle = "ENTERPRISE LOGISTICS",
  userName = "Alex Sterling",
  userRole = "Admin Account",
}: SidebarProps) {
  return (
    <aside className="flex h-full w-64 flex-col justify-between border-r border-slate-200 bg-white">
      <div>
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Boxes size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{companyName}</p>
            <p className="text-[10px] font-medium tracking-wide text-slate-400">{companySubtitle}</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 px-3 py-4">
          {NAV_ITEMS.map(({ route, label, icon: Icon }) => {
            const isActive = active === route;
            return (
              <button
                key={route}
                type="button"
                onClick={() => onNavigate(route)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Icon size={17} />
                {label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-100 p-3">
        <button
          type="button"
          onClick={() => onNavigate("settings")}
          className={`mb-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
            active === "settings" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Settings size={17} />
          Settings
        </button>
        <div className="flex items-center gap-2 rounded-lg px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
            {userName
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">{userName}</p>
            <p className="text-xs text-slate-400">{userRole}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
