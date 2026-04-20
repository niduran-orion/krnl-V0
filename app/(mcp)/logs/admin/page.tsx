import { AdminLogsView } from "@/components/mcp/logs/admin-logs-view"

export const metadata = {
  title: "Logs del Equipo — KRNL",
  description: "Observabilidad y trazabilidad de todos los agentes del equipo",
}

export default function AdminLogsPage() {
  return <AdminLogsView />
}
