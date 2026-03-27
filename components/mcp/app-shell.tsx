"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Bot,
  Database,
  Plug2,
  Radio,
  Settings,
  BookOpen,
  ShieldCheck,
  ChevronDown,
  Bell,
  Search,
  Zap,
  Store,
  Code2,
  GitBranch,
  Shield,
  FileText,
  Wrench,
  RefreshCw,
  FileCode2,
  Server,
  Cable,
  UserCircle2,
  Monitor,
  MessageCircle,
  Webhook,
} from "lucide-react"
import { cn } from "@/lib/utils"

const integrationSubItems = [
  { icon: FileCode2, label: "Catálogo Templates", href: "/templates" },
  { icon: Cable,     label: "Configurar Instancias", href: "/instances" },
  { icon: Server,    label: "Servidores Activos", href: "/servers" },
]

const canalesSubItems = [
  { icon: Monitor,       label: "Widget Web",      href: "/canales/widget" },
  { icon: MessageCircle, label: "Mensajería & RRSS", href: "/canales/mensajeria" },
  { icon: Webhook,       label: "Webhooks",          href: "/canales/webhooks" },
]

const navSections = [
  {
    label: "GESTIÓN",
    items: [
      { icon: LayoutDashboard, label: "Dashboard",      href: "#" },
      { icon: Bot,             label: "Agentes",        href: "/agente/conocimiento" },
      { icon: BookOpen,        label: "Colecciones",    href: "#" },
    ],
  },
  {
    label: "CONOCIMIENTO",
    items: [
      { icon: Database, label: "Fuentes de datos", href: "#" },
    ],
  },
  {
    label: "CONEXIONES",
    items: [
      {
        icon: Plug2,
        label: "Integraciones",
        href: "/templates",
        hasSubItems: true,
        matchPaths: ["/templates", "/instances", "/servers"],
      },
      {
        icon: Radio,
        label: "Canales",
        href: "/canales/widget",
        hasSubItems: true,
        subItemsKey: "canales",
        matchPaths: ["/canales/widget", "/canales/mensajeria", "/canales/webhooks"],
      },
    ],
  },
  {
    label: "HERRAMIENTAS",
    items: [
      { icon: Zap, label: "Playground", href: "/playground" },
    ],
  },
  {
    label: "ADMINISTRACIÓN",
    items: [
      { icon: Settings,   label: "Administración", href: "#" },
      { icon: ShieldCheck,label: "Gestión de LLM", href: "#" },
      { icon: Store,      label: "Marketplace",    href: "#" },
    ],
  },
  {
    label: "AVANZADO",
    items: [
      { icon: Code2,     label: "Agent Studio",         href: "#" },
      { icon: GitBranch, label: "Workflows",             href: "#" },
      { icon: Shield,    label: "Guardrails / Políticas",href: "#" },
      { icon: FileText,  label: "Logs / Observabilidad", href: "#" },
      { icon: Wrench,    label: "Config MCP / Tools",    href: "#" },
    ],
  },
]

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [integrationExpanded, setIntegrationExpanded] = useState(true)
  const [canalesExpanded, setCanalesExpanded] = useState(true)

  const toggleSection = (label: string) =>
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }))

  const isIntegrationsActive = (matchPaths?: string[]) =>
    matchPaths ? matchPaths.some((p) => pathname.startsWith(p)) : false

  const isSubItemActive = (href: string) => pathname === href

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F7F8FA" }}>

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside
        className="w-[240px] shrink-0 flex flex-col border-r"
        style={{ background: "#FFFFFF", borderColor: "rgba(145, 158, 171, 0.2)" }}
      >
        {/* Logo */}
        <div className="h-[60px] flex items-center px-5 shrink-0 border-b" style={{ borderColor: "rgba(145, 158, 171, 0.2)" }}>
          <Link href="/" className="flex items-center gap-2.5">
            {/* Gradient isotipo */}
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center shadow"
              style={{ background: "linear-gradient(135deg, #D4009A, #5E24D5)" }}
            >
              <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L3 7l9 5 9-5-9-5zM3 12l9 5 9-5M3 17l9 5 9-5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-[#1B2A3B] text-lg tracking-tight">KRNL</span>
              <span className="text-[10px] font-medium" style={{ color: "#94A3B8" }}>by ORION</span>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          {navSections.map((section) => {
            const isSectionCollapsed = collapsed[section.label]
            return (
              <div key={section.label} className="mb-1">
                {/* Section header */}
                <button
                  onClick={() => toggleSection(section.label)}
                  className="flex items-center justify-between w-full px-2 py-2 group"
                >
                  <span
                    className="text-[10px] font-semibold tracking-widest"
                    style={{ color: "#637381" }}
                  >
                    {section.label}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 transition-transform",
                      isSectionCollapsed && "-rotate-90"
                    )}
                    style={{ color: "#637381" }}
                  />
                </button>

                {!isSectionCollapsed && (
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const hasSubItems = (item as any).hasSubItems
                      const subItemsKey = (item as any).subItemsKey as string | undefined
                      const active = hasSubItems
                        ? isIntegrationsActive((item as any).matchPaths)
                        : item.href !== "#" && pathname.startsWith(item.href)
                      const isExpanded = subItemsKey === "canales" ? canalesExpanded : integrationExpanded
                      const toggleExpanded = subItemsKey === "canales"
                        ? () => setCanalesExpanded(!canalesExpanded)
                        : () => setIntegrationExpanded(!integrationExpanded)
                      const currentSubItems = subItemsKey === "canales" ? canalesSubItems : integrationSubItems

                      return (
                        <div key={item.label}>
                          {/* Nav item row */}
                          <div className="flex items-center gap-1">
                            <Link
                              href={item.href}
                              className={cn(
                                "flex items-center gap-2.5 flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                              )}
                              style={
                                active
                                  ? { background: "#0F2870", color: "#FFFFFF" }
                                  : undefined
                              }
                              onMouseEnter={(e) => {
                                if (!active) {
                                  e.currentTarget.style.background = "#F4F6F8"
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!active) {
                                  e.currentTarget.style.background = ""
                                }
                              }}
                            >
                              <item.icon
                                className="h-4 w-4 shrink-0"
                                style={{ color: active ? "#FFFFFF" : "#637381" }}
                              />
                              <span style={{ color: active ? "#FFFFFF" : "#212B36" }}>
                                {item.label}
                              </span>
                            </Link>

                            {/* Expand/collapse sub-items toggle */}
                            {hasSubItems && (
                              <button
                                onClick={toggleExpanded}
                                className="p-1.5 rounded-lg transition-colors"
                                style={{ color: "#637381" }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "#F4F6F8")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                              >
                                <ChevronDown
                                  className={cn("h-3.5 w-3.5 transition-transform", !isExpanded && "-rotate-90")}
                                />
                              </button>
                            )}
                          </div>

                          {/* Sub-items */}
                          {hasSubItems && isExpanded && (
                            <div
                              className="ml-3 mt-0.5 mb-1 pl-3 space-y-0.5 border-l-2"
                              style={{ borderColor: "rgba(145, 158, 171, 0.24)" }}
                            >
                              {currentSubItems.map((sub) => {
                                const subActive = isSubItemActive(sub.href)
                                return (
                                  <Link
                                    key={sub.href}
                                    href={sub.href}
                                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors"
                                    style={
                                      subActive
                                        ? { background: "#0F2870", color: "#FFFFFF" }
                                        : { color: "#454F5B" }
                                    }
                                    onMouseEnter={(e) => {
                                      if (!subActive) e.currentTarget.style.background = "#F4F6F8"
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!subActive) e.currentTarget.style.background = ""
                                    }}
                                  >
                                    <sub.icon
                                      className="h-3.5 w-3.5 shrink-0"
                                      style={{ color: subActive ? "#FFFFFF" : "#919EAB" }}
                                    />
                                    {sub.label}
                                  </Link>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Bottom version badge */}
        <div className="px-4 py-3 border-t shrink-0" style={{ borderColor: "rgba(145, 158, 171, 0.2)" }}>
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium"
            style={{ background: "#F1F5F9", color: "#64748B" }}
          >
            <Zap className="h-3 w-3" style={{ color: "#D4009A" }} />
            v2.1 Beta
          </div>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* Header */}
        <header
          className="h-[60px] shrink-0 flex items-center justify-between px-6 gap-4 border-b"
          style={{ background: "#FFFFFF", borderColor: "rgba(145, 158, 171, 0.2)" }}
        >
          {/* Search */}
          <div
            className="flex items-center gap-2 flex-1 max-w-md rounded-full px-4 py-2 border"
            style={{ background: "#F7F8FA", borderColor: "rgba(145, 158, 171, 0.32)" }}
          >
            <Search className="h-4 w-4 shrink-0" style={{ color: "#94A3B8" }} />
            <input
              placeholder="Buscar en KRNL..."
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: "#334155" }}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              className="p-2 rounded-lg border transition-colors"
              style={{ borderColor: "rgba(145, 158, 171, 0.32)", color: "#637381" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#F4F6F8")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "")}
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              className="relative p-2 rounded-lg border transition-colors"
              style={{ borderColor: "rgba(145, 158, 171, 0.32)", color: "#637381" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#F4F6F8")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "")}
            >
              <Bell className="h-4 w-4" />
              <span
                className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full ring-2 ring-white"
                style={{ background: "#D4009A" }}
              />
            </button>

            {/* Divider */}
            <div className="w-px h-8 mx-1" style={{ background: "rgba(145, 158, 171, 0.32)" }} />

            {/* User */}
            <button className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ background: "linear-gradient(135deg, #D4009A, #5E24D5)" }}
              >
                UA
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold leading-tight" style={{ color: "#212B36" }}>
                  Usuario Admin
                </p>
                <p className="text-xs leading-tight" style={{ color: "#919EAB" }}>
                  Mi Organización
                </p>
              </div>
              <ChevronDown className="h-4 w-4" style={{ color: "#94A3B8" }} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto" style={{ background: "#F7F8FA" }}>
          {children}
        </main>
      </div>
    </div>
  )
}
