import { cn } from "@/lib/utils"
import type { Status } from "@/lib/mcp-data"

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        status === "active"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-500"
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "active" ? "bg-emerald-500" : "bg-slate-400"
        )}
      />
      {status === "active" ? "Conectado" : "Sin conectar"}
    </span>
  )
}
