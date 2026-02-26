import type { TransactionStatus } from "@/types/transaction"

const STATUS_CONFIG: Record<
  TransactionStatus,
  { dot: string; bg: string; text: string }
> = {
  Pending: {
    dot: "bg-amber-500/70",
    bg: "bg-amber-500/10",
    text: "text-amber-400/90",
  },
  Settled: {
    dot: "bg-emerald-500/70",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400/90",
  },
  Failed: {
    dot: "bg-red-500/70",
    bg: "bg-red-500/10",
    text: "text-red-400/90",
  },
}

export function StatusBadge({ status }: { status: TransactionStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}
    >
      <span className={`size-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  )
}
