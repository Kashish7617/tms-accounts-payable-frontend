import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowUp } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string;
  icon: LucideIcon;
  changePct?: number;
  changeLabel?: string;
  neutral?: boolean;
  iconBgClassName?: string;
};

export default function StatCard({
  label,
  value,
  icon: Icon,
  changePct,
  changeLabel,
  neutral = false,
  iconBgClassName = "bg-slate-100 text-slate-700",
}: StatCardProps) {
  const isPositive = (changePct ?? 0) >= 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>

          <h3 className="mt-2 text-2xl font-semibold text-slate-900">
            {value}
          </h3>

          {!neutral && changePct !== undefined && (
            <div
              className={`mt-3 flex items-center gap-1 text-sm ${
                isPositive ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {isPositive ? (
                <ArrowUp size={14} />
              ) : (
                <ArrowDown size={14} />
              )}

              <span>{Math.abs(changePct)}%</span>
            </div>
          )}

          {neutral && changeLabel && (
            <p className="mt-3 text-sm text-slate-500">
              {changeLabel}
            </p>
          )}
        </div>

        <div className={`rounded-xl p-3 ${iconBgClassName}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}