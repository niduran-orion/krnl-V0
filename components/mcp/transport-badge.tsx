import { cn } from "@/lib/utils"
import type { Transport } from "@/lib/mcp-data"

export function TransportBadge({ transport }: { transport: Transport }) {
  const isStdio = transport === "NPX (stdio)" || transport === "UVX (stdio)"
  const isUVX = transport === "UVX (stdio)"
  
  return (
    <span
      className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium border"
      style={
        isStdio
          ? isUVX
            ? { background: "#F5F3FF", color: "#4A18A8", borderColor: "#C4B5FD" }
            : { background: "#FFF0FA", color: "#A4097B", borderColor: "#F9A8D4" }
          : { background: "#EFF6FF", color: "#1B3A6E", borderColor: "#BFDBFE" }
      }
    >
      {transport}
    </span>
  )
}
