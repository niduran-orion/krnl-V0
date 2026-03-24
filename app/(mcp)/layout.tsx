import { AppShell } from "@/components/mcp/app-shell"

export default function MCPLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
