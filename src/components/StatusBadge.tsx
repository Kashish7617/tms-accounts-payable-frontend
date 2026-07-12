const STATUS_STYLES: Record<string, string> = {
  Completed: "bg-emerald-50 text-emerald-700",
  Posted: "bg-emerald-50 text-emerald-700",
  Paid: "bg-emerald-50 text-emerald-700",
  Success: "bg-emerald-50 text-emerald-700",
  Pending: "bg-amber-50 text-amber-700",
  Processing: "bg-amber-50 text-amber-700",
  Sent: "bg-blue-50 text-blue-700",
  Draft: "bg-slate-100 text-slate-600",
  Flagged: "bg-red-50 text-red-700",
  Overdue: "bg-red-50 text-red-700",
  Failed: "bg-red-50 text-red-700",
};

export default function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${style}`}>
      {status}
    </span>
  );
}
