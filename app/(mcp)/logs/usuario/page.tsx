import { UserLogsView } from "@/components/mcp/logs/user-logs-view"

export const metadata = {
  title: "Mi Observabilidad — KRNL",
  description: "Trazabilidad y métricas de tus agentes CORE",
}

export default function UserLogsPage() {
  return <UserLogsView />
}
