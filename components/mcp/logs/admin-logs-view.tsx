"use client"

import { useState } from "react"
import {
  Activity,
  Users,
  Bot,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronRight,
  X,
  Clock,
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Filter,
  Download,
  Search,
  MoreHorizontal,
  ArrowRight,
} from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────────────────

type Status = "ok" | "warn" | "error"

interface TeamMember {
  id: string
  name: string
  initials: string
  role: string
  area: string
  agents: AgentSummary[]
}

interface AgentSummary {
  id: string
  name: string
  executions: number
  tokensUsed: number
  successRate: number
  avgLatency: number
  guardrailEvents: number
  lastActive: string
  status: "active" | "idle" | "error"
}

interface ExecutionTrace {
  id: string
  agentName: string
  user: string
  timestamp: string
  duration: number
  tokens: number
  status: Status
  steps: TraceStep[]
}

interface TraceStep {
  id: string
  label: string
  type: "guardrail" | "knowledge" | "tool" | "llm" | "output"
  duration: number
  status: Status
  detail?: string
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_MEMBERS: TeamMember[] = [
  {
    id: "u1",
    name: "Sofía Ramírez",
    initials: "SR",
    role: "Analista CX",
    area: "Customer Experience",
    agents: [
      {
        id: "a1", name: "Agente Atención", executions: 1420, tokensUsed: 312000,
        successRate: 97.2, avgLatency: 1340, guardrailEvents: 12, lastActive: "hace 2 min", status: "active",
      },
      {
        id: "a2", name: "Agente FAQ", executions: 880, tokensUsed: 145000,
        successRate: 99.1, avgLatency: 890, guardrailEvents: 2, lastActive: "hace 18 min", status: "idle",
      },
    ],
  },
  {
    id: "u2",
    name: "Mateo García",
    initials: "MG",
    role: "Ops Lead",
    area: "Operaciones",
    agents: [
      {
        id: "a3", name: "Agente CRM", executions: 540, tokensUsed: 98000,
        successRate: 94.8, avgLatency: 2100, guardrailEvents: 28, lastActive: "hace 5 min", status: "active",
      },
    ],
  },
  {
    id: "u3",
    name: "Valentina Cruz",
    initials: "VC",
    role: "RRHH Specialist",
    area: "Recursos Humanos",
    agents: [
      {
        id: "a4", name: "Agente Onboarding", executions: 230, tokensUsed: 67000,
        successRate: 98.7, avgLatency: 1120, guardrailEvents: 3, lastActive: "hace 1 h", status: "idle",
      },
      {
        id: "a5", name: "Agente Políticas", executions: 95, tokensUsed: 28000,
        successRate: 88.4, avgLatency: 3200, guardrailEvents: 41, lastActive: "hace 3 h", status: "error",
      },
    ],
  },
  {
    id: "u4",
    name: "Andrés Molina",
    initials: "AM",
    role: "Dev Senior",
    area: "Tecnología",
    agents: [
      {
        id: "a6", name: "Agente Docs Técnicos", executions: 760, tokensUsed: 210000,
        successRate: 96.0, avgLatency: 1680, guardrailEvents: 7, lastActive: "hace 30 min", status: "active",
      },
    ],
  },
]

const MOCK_TRACES: ExecutionTrace[] = [
  {
    id: "t1", agentName: "Agente Atención", user: "Sofía Ramírez",
    timestamp: "2025-04-19 14:32:10", duration: 1340, tokens: 820, status: "ok",
    steps: [
      { id: "s1", label: "Guardrail — Filtro SQL", type: "guardrail", duration: 42, status: "ok", detail: "Sin inyección detectada" },
      { id: "s2", label: "Knowledge — Base CX", type: "knowledge", duration: 380, status: "ok", detail: "3 fragmentos recuperados (score > 0.82)" },
      { id: "s3", label: "LLM — GPT-4o", type: "llm", duration: 860, status: "ok", detail: "810 tokens · temperatura 0.3" },
      { id: "s4", label: "Respuesta al usuario", type: "output", duration: 58, status: "ok" },
    ],
  },
  {
    id: "t2", agentName: "Agente Políticas", user: "Valentina Cruz",
    timestamp: "2025-04-19 14:28:44", duration: 3200, tokens: 1420, status: "error",
    steps: [
      { id: "s1", label: "Guardrail — Política interna", type: "guardrail", duration: 55, status: "warn", detail: "Nivel de riesgo: MEDIO — contenido sobre bajas laborales" },
      { id: "s2", label: "Knowledge — RRHH Docs", type: "knowledge", duration: 620, status: "ok", detail: "5 fragmentos recuperados" },
      { id: "s3", label: "LLM — Claude 3.5", type: "llm", duration: 2480, status: "error", detail: "Timeout a los 2480ms · respuesta incompleta" },
      { id: "s4", label: "Fallback activado", type: "output", duration: 45, status: "warn", detail: "Mensaje de error amigable enviado al usuario" },
    ],
  },
  {
    id: "t3", agentName: "Agente CRM", user: "Mateo García",
    timestamp: "2025-04-19 14:25:01", duration: 2100, tokens: 640, status: "warn",
    steps: [
      { id: "s1", label: "Guardrail — Datos sensibles", type: "guardrail", duration: 38, status: "ok" },
      { id: "s2", label: "Tool — Salesforce API", type: "tool", duration: 1180, status: "warn", detail: "Latencia alta: 1180ms (umbral 800ms)" },
      { id: "s3", label: "LLM — GPT-4o mini", type: "llm", duration: 840, status: "ok", detail: "620 tokens" },
      { id: "s4", label: "Respuesta al usuario", type: "output", duration: 42, status: "ok" },
    ],
  },
]

const BAR_DATA = [
  { label: "Ag. Atención", value: 1420, color: "#D4009A" },
  { label: "Ag. FAQ", value: 880, color: "#5E24D5" },
  { label: "Ag. CRM", value: 540, color: "#0891B2" },
  { label: "Ag. Onboarding", value: 230, color: "#10B981" },
  { label: "Ag. Docs", value: 760, color: "#F59E0B" },
  { label: "Ag. Políticas", value: 95, color: "#EF4444" },
]

// ─── Time ranges ─────────────────────────────────────────────────────────────

type TimeRange = "hoy" | "semana" | "mes" | "historico"

const TIME_RANGES: { id: TimeRange; label: string; multiplier: number; periodLabel: string }[] = [
  { id: "hoy",       label: "Hoy",          multiplier: 1,    periodLabel: "Hoy"          },
  { id: "semana",    label: "Esta semana",   multiplier: 7,    periodLabel: "Esta semana"  },
  { id: "mes",       label: "Este mes",      multiplier: 30,   periodLabel: "Este mes"     },
  { id: "historico", label: "Histórico",     multiplier: 180,  periodLabel: "Todo el tiempo" },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusIcon = (s: Status) => {
  if (s === "ok")    return <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#16A34A" }} />
  if (s === "warn")  return <AlertTriangle className="h-3.5 w-3.5" style={{ color: "#D97706" }} />
  return               <XCircle className="h-3.5 w-3.5" style={{ color: "#DC2626" }} />
}

const statusBadge = (s: Status) => {
  if (s === "ok")    return { bg: "#F0FDF4", text: "#16A34A", label: "OK" }
  if (s === "warn")  return { bg: "#FFFBEB", text: "#D97706", label: "Advertencia" }
  return               { bg: "#FEF2F2", text: "#DC2626", label: "Error" }
}

const stepTypeColor: Record<TraceStep["type"], string> = {
  guardrail: "#D4009A",
  knowledge: "#5E24D5",
  tool:      "#0891B2",
  llm:       "#0F2870",
  output:    "#10B981",
}

const stepTypeLabel: Record<TraceStep["type"], string> = {
  guardrail: "Guardrail",
  knowledge: "Conocimiento",
  tool:      "Herramienta",
  llm:       "LLM",
  output:    "Salida",
}

function kfmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon: Icon, trend }: {
  label: string
  value: string
  sub?: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  trend?: "up" | "down" | "neutral"
}) {
  return (
    <div
      className="flex-1 rounded-2xl border p-5 flex flex-col gap-3"
      style={{ background: "#FFFFFF", borderColor: "rgba(145,158,171,0.16)" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: "#637381" }}>{label}</span>
        <div className="h-8 w-8 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(212,0,154,0.08)" }}>
          <Icon className="h-4 w-4" style={{ color: "#D4009A" }} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color: "#1C2434" }}>{value}</p>
        {sub && (
          <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: trend === "up" ? "#16A34A" : trend === "down" ? "#DC2626" : "#637381" }}>
            {trend === "up" && <TrendingUp className="h-3 w-3" />}
            {trend === "down" && <TrendingDown className="h-3 w-3" />}
            {sub}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Trace drawer ─────────────────────────────────────────────────────────────

function TraceDrawer({ trace, onClose }: { trace: ExecutionTrace; onClose: () => void }) {
  const badge = statusBadge(trace.status)
  const maxDuration = Math.max(...trace.steps.map((s) => s.duration))
  return (
    <div
      className="w-[400px] shrink-0 border-l flex flex-col h-full"
      style={{ background: "#FFFFFF", borderColor: "rgba(145,158,171,0.16)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b shrink-0"
        style={{ borderColor: "rgba(145,158,171,0.12)" }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: "#1C2434" }}>Traza de ejecución</p>
          <p className="text-xs mt-0.5" style={{ color: "#637381" }}>{trace.agentName} · {trace.user}</p>
        </div>
        <button onClick={onClose}
          className="p-1.5 rounded-lg transition-colors hover:bg-slate-100"
          style={{ color: "#637381" }}>
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Summary */}
      <div className="px-5 py-4 border-b flex items-center gap-4 shrink-0"
        style={{ borderColor: "rgba(145,158,171,0.12)", background: "#F8F9FC" }}>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: "#9AA3B0" }}>Duración</p>
          <p className="text-base font-bold" style={{ color: "#1C2434" }}>{trace.duration}ms</p>
        </div>
        <div className="w-px h-8" style={{ background: "rgba(145,158,171,0.2)" }} />
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: "#9AA3B0" }}>Tokens</p>
          <p className="text-base font-bold" style={{ color: "#1C2434" }}>{trace.tokens.toLocaleString()}</p>
        </div>
        <div className="w-px h-8" style={{ background: "rgba(145,158,171,0.2)" }} />
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: "#9AA3B0" }}>Estado</p>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: badge.bg, color: badge.text }}>
            {badge.label}
          </span>
        </div>
      </div>

      {/* Steps timeline */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: "#9AA3B0" }}>
          Pasos de ejecución
        </p>
        {trace.steps.map((step, i) => (
          <div key={step.id} className="flex gap-3">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div className="h-6 w-6 rounded-full flex items-center justify-center shrink-0"
                style={{ background: stepTypeColor[step.type] + "18", border: `1.5px solid ${stepTypeColor[step.type]}` }}>
                <span className="text-[8px] font-bold" style={{ color: stepTypeColor[step.type] }}>
                  {i + 1}
                </span>
              </div>
              {i < trace.steps.length - 1 && (
                <div className="w-px flex-1 mt-1" style={{ background: "rgba(145,158,171,0.2)", minHeight: "12px" }} />
              )}
            </div>

            {/* Step content */}
            <div className="flex-1 pb-2">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                    style={{ background: stepTypeColor[step.type] + "15", color: stepTypeColor[step.type] }}>
                    {stepTypeLabel[step.type]}
                  </span>
                  <span className="text-xs font-medium" style={{ color: "#1C2434" }}>{step.label}</span>
                </div>
                {statusIcon(step.status)}
              </div>

              {/* Duration bar */}
              <div className="h-1.5 rounded-full mb-1.5" style={{ background: "#F1F5F9" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(4, (step.duration / maxDuration) * 100)}%`,
                    background: step.status === "error" ? "#EF4444"
                      : step.status === "warn" ? "#F59E0B"
                      : stepTypeColor[step.type],
                  }}
                />
              </div>
              <p className="text-[10px]" style={{ color: "#9AA3B0" }}>{step.duration}ms</p>
              {step.detail && (
                <p className="text-[11px] mt-1 p-2 rounded-lg" style={{ background: "#F8F9FC", color: "#454F5B" }}>
                  {step.detail}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Timestamp footer */}
      <div className="px-5 py-3 border-t shrink-0" style={{ borderColor: "rgba(145,158,171,0.12)" }}>
        <p className="text-[11px]" style={{ color: "#9AA3B0" }}>
          <Clock className="h-3 w-3 inline mr-1" />
          {trace.timestamp}
        </p>
      </div>
    </div>
  )
}

// ─── Main view ────────────────────────────────────────────────────────────────

export function AdminLogsView() {
  const [expandedMember, setExpandedMember] = useState<string | null>("u1")
  const [selectedTrace, setSelectedTrace] = useState<ExecutionTrace | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterArea, setFilterArea] = useState<string>("Todos")
  const [timeRange, setTimeRange] = useState<TimeRange>("hoy")

  const currentRange = TIME_RANGES.find((r) => r.id === timeRange)!
  const m = currentRange.multiplier

  const areas = ["Todos", ...Array.from(new Set(MOCK_MEMBERS.map((mem) => mem.area)))]

  const scaledBarData = BAR_DATA.map((d) => ({ ...d, value: Math.round(d.value * m) }))
  const maxBar = Math.max(...scaledBarData.map((d) => d.value))

  const filteredMembers = MOCK_MEMBERS.filter((mem) => {
    const matchArea = filterArea === "Todos" || mem.area === filterArea
    const matchSearch = searchQuery === "" ||
      mem.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mem.agents.some((a) => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchArea && matchSearch
  })

  const allAgents = MOCK_MEMBERS.flatMap((mem) => mem.agents)
  const totalExecs     = Math.round(allAgents.reduce((s, a) => s + a.executions, 0) * m)
  const totalTokens    = Math.round(allAgents.reduce((s, a) => s + a.tokensUsed, 0) * m)
  const totalGuardrail = Math.round(allAgents.reduce((s, a) => s + a.guardrailEvents, 0) * m)
  const avgSuccess     = allAgents.reduce((s, a) => s + a.successRate, 0) / allAgents.length

  return (
    <div className="flex h-full" style={{ background: "#F7F8FA" }}>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Page header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b shrink-0 gap-4 flex-wrap"
          style={{ background: "#FFFFFF", borderColor: "rgba(145,158,171,0.16)" }}
        >
          <div>
            <h1 className="text-lg font-bold" style={{ color: "#1C2434" }}>
              Logs del Equipo
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "#637381" }}>
              Observabilidad de todos los agentes del equipo — vista de administrador
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Time range pill selector */}
            <div
              className="flex items-center rounded-xl p-1 gap-0.5"
              style={{ background: "#F4F6F8" }}
            >
              {TIME_RANGES.map((r) => {
                const active = timeRange === r.id
                return (
                  <button
                    key={r.id}
                    onClick={() => setTimeRange(r.id)}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                    style={{
                      background: active ? "#FFFFFF" : "transparent",
                      color: active ? "#D4009A" : "#637381",
                      boxShadow: active ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                      fontWeight: active ? 600 : 500,
                    }}
                  >
                    {r.label}
                  </button>
                )
              })}
            </div>

            <div className="w-px h-5" style={{ background: "rgba(145,158,171,0.2)" }} />

            <button
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors"
              style={{ borderColor: "rgba(145,158,171,0.24)", color: "#637381", background: "#FFFFFF" }}
            >
              <Download className="h-3.5 w-3.5" />
              Exportar CSV
            </button>
            <button
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors"
              style={{ borderColor: "rgba(145,158,171,0.24)", color: "#637381", background: "#FFFFFF" }}
            >
              <Filter className="h-3.5 w-3.5" />
              Filtros
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* KPI strip */}
          <div className="flex gap-4">
            <KpiCard label="Ejecuciones totales"    value={kfmt(totalExecs)}                sub={currentRange.periodLabel} icon={Activity}    trend="up"      />
            <KpiCard label="Tokens consumidos"       value={kfmt(totalTokens)}               sub={currentRange.periodLabel} icon={Zap}         trend="neutral" />
            <KpiCard label="Tasa de éxito promedio" value={`${avgSuccess.toFixed(1)}%`}     sub="Promedio del equipo"      icon={TrendingUp}  trend="down"    />
            <KpiCard label="Eventos guardrail"       value={kfmt(totalGuardrail)}             sub={currentRange.periodLabel} icon={ShieldAlert} trend="neutral" />
          </div>

          {/* Execution by agent chart */}
          <div
            className="rounded-2xl border p-5"
            style={{ background: "#FFFFFF", borderColor: "rgba(145,158,171,0.16)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-sm font-semibold" style={{ color: "#1C2434" }}>Ejecuciones por agente</p>
                <p className="text-xs mt-0.5" style={{ color: "#637381" }}>{currentRange.periodLabel} · Total acumulado</p>
              </div>
            </div>
            <div className="flex items-end gap-3 h-28">
              {scaledBarData.map((d) => (
                <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-semibold" style={{ color: "#1C2434" }}>{kfmt(d.value)}</span>
                  <div className="w-full rounded-t-md" style={{
                    height: `${Math.max(6, (d.value / maxBar) * 80)}px`,
                    background: d.color,
                    opacity: 0.85,
                  }} />
                  <span className="text-[9px] text-center leading-tight" style={{ color: "#9AA3B0" }}>
                    {d.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Search + filter row */}
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 flex-1 rounded-xl border px-3 py-2"
              style={{ background: "#FFFFFF", borderColor: "rgba(145,158,171,0.24)" }}
            >
              <Search className="h-3.5 w-3.5 shrink-0" style={{ color: "#94A3B8" }} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por miembro o agente..."
                className="flex-1 bg-transparent text-xs outline-none"
                style={{ color: "#1C2434" }}
              />
            </div>
            <div className="flex items-center gap-1.5">
              {areas.map((area) => (
                <button
                  key={area}
                  onClick={() => setFilterArea(area)}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                  style={filterArea === area
                    ? { background: "#0F2870", color: "#FFFFFF" }
                    : { background: "#FFFFFF", color: "#637381", border: "1px solid rgba(145,158,171,0.24)" }}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>

          {/* Team members table */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ background: "#FFFFFF", borderColor: "rgba(145,158,171,0.16)" }}
          >
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(145,158,171,0.12)", background: "#F8F9FC" }}>
                  {["Miembro / Agente", "Área", "Ejecuciones", "Tokens", "Tasa éxito", "Lat. prom.", "Guardrail", "Último activo", ""].map((h) => (
                    <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-wider px-4 py-3"
                      style={{ color: "#637381" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => (
                  <>
                    {/* Member row */}
                    <tr
                      key={member.id}
                      className="cursor-pointer transition-colors"
                      style={{ borderBottom: "1px solid rgba(145,158,171,0.08)" }}
                      onClick={() => setExpandedMember(expandedMember === member.id ? null : member.id)}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#F8F9FC")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <ChevronRight
                            className="h-4 w-4 transition-transform shrink-0"
                            style={{
                              color: "#9AA3B0",
                              transform: expandedMember === member.id ? "rotate(90deg)" : "rotate(0deg)",
                            }}
                          />
                          <div
                            className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                            style={{ background: "linear-gradient(135deg,#D4009A,#5E24D5)" }}
                          >
                            {member.initials}
                          </div>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: "#1C2434" }}>{member.name}</p>
                            <p className="text-[11px]" style={{ color: "#9AA3B0" }}>{member.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: "#EEF2FF", color: "#5E24D5" }}>
                          {member.area}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold" style={{ color: "#1C2434" }}>
                        {kfmt(member.agents.reduce((s, a) => s + a.executions, 0))}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "#454F5B" }}>
                        {kfmt(member.agents.reduce((s, a) => s + a.tokensUsed, 0))}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1 h-1.5 rounded-full" style={{ background: "#F1F5F9", maxWidth: "60px" }}>
                            <div className="h-full rounded-full" style={{
                              width: `${member.agents.reduce((s, a) => s + a.successRate, 0) / member.agents.length}%`,
                              background: "#10B981",
                            }} />
                          </div>
                          <span className="text-xs font-medium" style={{ color: "#1C2434" }}>
                            {(member.agents.reduce((s, a) => s + a.successRate, 0) / member.agents.length).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "#454F5B" }}>
                        {Math.round(member.agents.reduce((s, a) => s + a.avgLatency, 0) / member.agents.length)}ms
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold" style={{
                          color: member.agents.reduce((s, a) => s + a.guardrailEvents, 0) > 20 ? "#DC2626" : "#637381"
                        }}>
                          {member.agents.reduce((s, a) => s + a.guardrailEvents, 0)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "#9AA3B0" }}>—</td>
                      <td className="px-4 py-3">
                        <button className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
                          <MoreHorizontal className="h-4 w-4" style={{ color: "#9AA3B0" }} />
                        </button>
                      </td>
                    </tr>

                    {/* Expanded agent rows */}
                    {expandedMember === member.id && member.agents.map((agent) => (
                      <tr
                        key={agent.id}
                        className="transition-colors"
                        style={{ borderBottom: "1px solid rgba(145,158,171,0.06)", background: "#FAFBFC" }}
                      >
                        <td className="px-4 py-2.5 pl-14">
                          <div className="flex items-center gap-2">
                            <Bot className="h-3.5 w-3.5 shrink-0" style={{ color: "#9AA3B0" }} />
                            <span className="text-xs font-medium" style={{ color: "#454F5B" }}>{agent.name}</span>
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{
                                background: agent.status === "active" ? "#16A34A"
                                  : agent.status === "error" ? "#DC2626" : "#D97706"
                              }}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-2.5">—</td>
                        <td className="px-4 py-2.5 text-xs font-semibold" style={{ color: "#1C2434" }}>
                          {kfmt(agent.executions)}
                        </td>
                        <td className="px-4 py-2.5 text-xs" style={{ color: "#637381" }}>
                          {kfmt(agent.tokensUsed)}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-xs font-medium" style={{
                            color: agent.successRate >= 96 ? "#16A34A" : agent.successRate >= 90 ? "#D97706" : "#DC2626"
                          }}>
                            {agent.successRate}%
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs" style={{ color: "#637381" }}>{agent.avgLatency}ms</td>
                        <td className="px-4 py-2.5 text-xs" style={{
                          color: agent.guardrailEvents > 20 ? "#DC2626" : "#637381"
                        }}>
                          {agent.guardrailEvents}
                        </td>
                        <td className="px-4 py-2.5 text-xs" style={{ color: "#9AA3B0" }}>{agent.lastActive}</td>
                        <td className="px-4 py-2.5">
                          <button
                            onClick={() => setSelectedTrace(MOCK_TRACES.find((t) => t.agentName === agent.name) ?? MOCK_TRACES[0])}
                            className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg transition-colors"
                            style={{ background: "#EEF2FF", color: "#5E24D5" }}
                          >
                            Ver trazas <ArrowRight className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recent guardrail events */}
          <div
            className="rounded-2xl border p-5"
            style={{ background: "#FFFFFF", borderColor: "rgba(145,158,171,0.16)" }}
          >
            <p className="text-sm font-semibold mb-4" style={{ color: "#1C2434" }}>
              Eventos recientes de Guardrail
            </p>
            <div className="space-y-2">
              {MOCK_TRACES.flatMap((t) => t.steps.filter((s) => s.type === "guardrail" && s.status !== "ok").map((s) => ({
                trace: t, step: s
              }))).concat(
                MOCK_TRACES.flatMap((t) => t.steps.filter((s) => s.type === "guardrail").slice(0, 1).map((s) => ({ trace: t, step: s })))
              ).slice(0, 5).map(({ trace, step }, i) => {
                const badge = statusBadge(step.status)
                return (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl"
                    style={{ background: "#F8F9FC" }}>
                    <div className="mt-0.5">{statusIcon(step.status)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold" style={{ color: "#1C2434" }}>{trace.agentName}</span>
                        <span className="text-xs" style={{ color: "#9AA3B0" }}>—</span>
                        <span className="text-xs" style={{ color: "#9AA3B0" }}>{trace.user}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{ background: badge.bg, color: badge.text }}>
                          {badge.label}
                        </span>
                      </div>
                      {step.detail && (
                        <p className="text-xs mt-0.5" style={{ color: "#637381" }}>{step.detail}</p>
                      )}
                    </div>
                    <span className="text-[10px] shrink-0" style={{ color: "#9AA3B0" }}>{trace.timestamp.split(" ")[1]}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Trace drawer ── */}
      {selectedTrace && (
        <TraceDrawer trace={selectedTrace} onClose={() => setSelectedTrace(null)} />
      )}
    </div>
  )
}
