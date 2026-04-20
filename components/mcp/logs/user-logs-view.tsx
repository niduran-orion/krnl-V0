"use client"

import { useState } from "react"
import {
  Activity,
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  Bot,
  Database,
  Wrench,
  Cpu,
  ArrowUpRight,
  ShieldCheck,
  TrendingUp,
} from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────────────────

type Status = "ok" | "warn" | "error"

interface MyAgent {
  id: string
  name: string
  model: string
  status: "active" | "idle" | "error"
  executions: number
  successRate: number
  tokensUsed: number
  avgLatency: number
}

interface Execution {
  id: string
  agentId: string
  agentName: string
  timestamp: string
  duration: number
  tokens: number
  status: Status
  userMessage: string
  steps: ExecStep[]
}

interface ExecStep {
  id: string
  type: "guardrail" | "knowledge" | "tool" | "llm" | "output"
  label: string
  duration: number
  status: Status
  detail?: string
  tokens?: number
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MY_AGENTS: MyAgent[] = [
  {
    id: "a1", name: "Agente Ventas", model: "GPT-4o",
    status: "active", executions: 432, successRate: 96.8, tokensUsed: 98400, avgLatency: 1210,
  },
  {
    id: "a2", name: "Agente Soporte", model: "Claude 3.5 Sonnet",
    status: "idle", executions: 187, successRate: 99.2, tokensUsed: 41000, avgLatency: 880,
  },
  {
    id: "a3", name: "Agente Reportes", model: "GPT-4o mini",
    status: "error", executions: 64, successRate: 79.4, tokensUsed: 18200, avgLatency: 3400,
  },
]

const MY_EXECUTIONS: Execution[] = [
  {
    id: "e1", agentId: "a1", agentName: "Agente Ventas",
    timestamp: "2025-04-19 14:45:22", duration: 1210, tokens: 640, status: "ok",
    userMessage: "¿Cuáles son las condiciones del contrato para clientes enterprise?",
    steps: [
      { id: "s1", type: "guardrail", label: "Filtro de contenido", duration: 35, status: "ok", detail: "Sin contenido sensible detectado" },
      { id: "s2", type: "knowledge", label: "Base de conocimiento Ventas", duration: 390, status: "ok", detail: "4 fragmentos recuperados · score máx 0.91" },
      { id: "s3", type: "llm", label: "GPT-4o", duration: 740, status: "ok", detail: "620 tokens · temp 0.2", tokens: 620 },
      { id: "s4", type: "output", label: "Respuesta enviada", duration: 45, status: "ok" },
    ],
  },
  {
    id: "e2", agentId: "a1", agentName: "Agente Ventas",
    timestamp: "2025-04-19 14:38:07", duration: 1540, tokens: 920, status: "warn",
    userMessage: "Dame el historial de compras de todos los clientes del Q1",
    steps: [
      { id: "s1", type: "guardrail", label: "Filtro de PII / datos sensibles", duration: 52, status: "warn", detail: "Detectada solicitud de datos masivos — requiere revisión" },
      { id: "s2", type: "knowledge", label: "Base de conocimiento Ventas", duration: 480, status: "ok", detail: "2 fragmentos recuperados" },
      { id: "s3", type: "tool", label: "CRM — Salesforce API", duration: 820, status: "warn", detail: "Respuesta parcial: timeout parcial en registros > 500" },
      { id: "s4", type: "llm", label: "GPT-4o", duration: 145, status: "ok", detail: "890 tokens", tokens: 890 },
      { id: "s5", type: "output", label: "Respuesta con advertencia", duration: 43, status: "warn" },
    ],
  },
  {
    id: "e3", agentId: "a3", agentName: "Agente Reportes",
    timestamp: "2025-04-19 13:59:41", duration: 3400, tokens: 0, status: "error",
    userMessage: "Genera el reporte mensual de ventas en PDF",
    steps: [
      { id: "s1", type: "guardrail", label: "Filtro de contenido", duration: 40, status: "ok" },
      { id: "s2", type: "tool", label: "Report Generator — PDF", duration: 3320, status: "error", detail: "Error 503: servicio no disponible · 3 reintentos fallidos" },
      { id: "s3", type: "output", label: "Error enviado al usuario", duration: 40, status: "error" },
    ],
  },
  {
    id: "e4", agentId: "a2", agentName: "Agente Soporte",
    timestamp: "2025-04-19 13:22:15", duration: 880, tokens: 410, status: "ok",
    userMessage: "¿Cómo puedo restablecer mi contraseña?",
    steps: [
      { id: "s1", type: "guardrail", label: "Filtro de contenido", duration: 28, status: "ok" },
      { id: "s2", type: "knowledge", label: "Base de conocimiento Soporte", duration: 310, status: "ok", detail: "2 fragmentos recuperados · score máx 0.95" },
      { id: "s3", type: "llm", label: "Claude 3.5 Sonnet", duration: 510, status: "ok", detail: "400 tokens", tokens: 400 },
      { id: "s4", type: "output", label: "Respuesta enviada", duration: 32, status: "ok" },
    ],
  },
]

const TOKEN_USAGE = [
  { label: "Ag. Ventas",   value: 98400, color: "#D4009A" },
  { label: "Ag. Soporte",  value: 41000, color: "#5E24D5" },
  { label: "Ag. Reportes", value: 18200, color: "#0891B2" },
]

// ─── Time ranges ─────────────────────────────────────────────────────────────

type TimeRange = "hoy" | "semana" | "mes" | "historico"

const TIME_RANGES: { id: TimeRange; label: string; multiplier: number; periodLabel: string }[] = [
  { id: "hoy",       label: "Hoy",          multiplier: 1,    periodLabel: "Hoy"            },
  { id: "semana",    label: "Esta semana",   multiplier: 7,    periodLabel: "Esta semana"    },
  { id: "mes",       label: "Este mes",      multiplier: 30,   periodLabel: "Este mes"       },
  { id: "historico", label: "Histórico",     multiplier: 180,  periodLabel: "Todo el tiempo" },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusIcon = (s: Status, size = "h-3.5 w-3.5") => {
  if (s === "ok")    return <CheckCircle2 className={size} style={{ color: "#16A34A" }} />
  if (s === "warn")  return <AlertTriangle className={size} style={{ color: "#D97706" }} />
  return               <XCircle className={size} style={{ color: "#DC2626" }} />
}

const statusBadge = (s: Status) => {
  if (s === "ok")    return { bg: "#F0FDF4", text: "#16A34A", label: "Exitosa" }
  if (s === "warn")  return { bg: "#FFFBEB", text: "#D97706", label: "Advertencia" }
  return               { bg: "#FEF2F2", text: "#DC2626", label: "Error" }
}

const stepTypeColor: Record<ExecStep["type"], string> = {
  guardrail: "#D4009A",
  knowledge: "#5E24D5",
  tool:      "#0891B2",
  llm:       "#0F2870",
  output:    "#10B981",
}

const stepTypeIcon: Record<ExecStep["type"], React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  guardrail: ShieldCheck,
  knowledge: Database,
  tool:      Wrench,
  llm:       Cpu,
  output:    ArrowUpRight,
}

const stepTypeLabel: Record<ExecStep["type"], string> = {
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

function KpiCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string; sub?: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  accent?: string
}) {
  const color = accent ?? "#D4009A"
  return (
    <div className="flex-1 rounded-2xl border p-4 flex flex-col gap-2.5"
      style={{ background: "#FFFFFF", borderColor: "rgba(145,158,171,0.16)" }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: "#637381" }}>{label}</span>
        <div className="h-7 w-7 rounded-lg flex items-center justify-center"
          style={{ background: color + "14" }}>
          <Icon className="h-3.5 w-3.5" style={{ color }} />
        </div>
      </div>
      <p className="text-xl font-bold" style={{ color: "#1C2434" }}>{value}</p>
      {sub && <p className="text-[11px]" style={{ color: "#9AA3B0" }}>{sub}</p>}
    </div>
  )
}

// ─── Execution row with expandable trace ─────────────────────────────────────

function ExecutionRow({ exec }: { exec: Execution }) {
  const [open, setOpen] = useState(false)
  const badge = statusBadge(exec.status)
  const maxDuration = Math.max(...exec.steps.map((s) => s.duration))

  return (
    <div
      className="border rounded-2xl overflow-hidden transition-all"
      style={{
        borderColor: open ? "#D4009A" : "rgba(145,158,171,0.16)",
        background: "#FFFFFF",
      }}
    >
      {/* Row header */}
      <button
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors"
        style={{ background: open ? "#FFF8FD" : "#FFFFFF" }}
        onClick={() => setOpen((o) => !o)}
      >
        {/* Status */}
        {statusIcon(exec.status)}

        {/* Agent + message */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold" style={{ color: "#1C2434" }}>{exec.agentName}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ background: badge.bg, color: badge.text }}>
              {badge.label}
            </span>
          </div>
          <p className="text-xs mt-0.5 truncate" style={{ color: "#637381" }}>
            &ldquo;{exec.userMessage}&rdquo;
          </p>
        </div>

        {/* Meta */}
        <div className="hidden sm:flex items-center gap-5 shrink-0">
          <div className="text-right">
            <p className="text-[10px]" style={{ color: "#9AA3B0" }}>Duración</p>
            <p className="text-xs font-semibold" style={{ color: "#1C2434" }}>{exec.duration}ms</p>
          </div>
          <div className="text-right">
            <p className="text-[10px]" style={{ color: "#9AA3B0" }}>Tokens</p>
            <p className="text-xs font-semibold" style={{ color: "#1C2434" }}>
              {exec.tokens > 0 ? exec.tokens.toLocaleString() : "—"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px]" style={{ color: "#9AA3B0" }}>Hora</p>
            <p className="text-xs" style={{ color: "#9AA3B0" }}>{exec.timestamp.split(" ")[1]}</p>
          </div>
        </div>

        <ChevronDown
          className="h-4 w-4 shrink-0 transition-transform"
          style={{ color: "#9AA3B0", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {/* Expanded trace */}
      {open && (
        <div className="px-5 pb-5 border-t pt-4 space-y-2"
          style={{ borderColor: "rgba(212,0,154,0.12)" }}>
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: "#9AA3B0" }}>
            Pasos de ejecución
          </p>
          {exec.steps.map((step, i) => {
            const StepIcon = stepTypeIcon[step.type]
            return (
              <div key={step.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className="h-6 w-6 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background: stepTypeColor[step.type] + "15",
                      border: `1.5px solid ${stepTypeColor[step.type]}40`,
                    }}
                  >
                    <StepIcon className="h-3 w-3" style={{ color: stepTypeColor[step.type] }} />
                  </div>
                  {i < exec.steps.length - 1 && (
                    <div className="w-px flex-1 mt-1"
                      style={{ background: "rgba(145,158,171,0.16)", minHeight: "10px" }} />
                  )}
                </div>

                <div className="flex-1 pb-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                        style={{ background: stepTypeColor[step.type] + "15", color: stepTypeColor[step.type] }}
                      >
                        {stepTypeLabel[step.type]}
                      </span>
                      <span className="text-xs font-medium" style={{ color: "#1C2434" }}>{step.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {statusIcon(step.status, "h-3 w-3")}
                      <span className="text-[11px]" style={{ color: "#9AA3B0" }}>{step.duration}ms</span>
                    </div>
                  </div>

                  {/* Duration bar */}
                  <div className="h-1 rounded-full mb-1" style={{ background: "#F1F5F9" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.max(4, (step.duration / maxDuration) * 100)}%`,
                        background: step.status === "error" ? "#EF4444"
                          : step.status === "warn" ? "#F59E0B"
                          : stepTypeColor[step.type],
                      }}
                    />
                  </div>

                  {step.detail && (
                    <p className="text-[11px] mt-1.5 px-2.5 py-1.5 rounded-lg"
                      style={{ background: "#F8F9FC", color: "#637381" }}>
                      {step.detail}
                    </p>
                  )}
                  {step.tokens && (
                    <p className="text-[10px] mt-1" style={{ color: "#9AA3B0" }}>
                      <Zap className="h-2.5 w-2.5 inline mr-0.5" style={{ color: "#D4009A" }} />
                      {step.tokens.toLocaleString()} tokens
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Main view ────────────────────────────────────────────────────────────────

export function UserLogsView() {
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>("Todos")
  const [timeRange, setTimeRange] = useState<TimeRange>("hoy")

  const currentRange = TIME_RANGES.find((r) => r.id === timeRange)!
  const mul = currentRange.multiplier

  const totalExecs  = Math.round(MY_AGENTS.reduce((s, a) => s + a.executions, 0) * mul)
  const totalTokens = Math.round(MY_AGENTS.reduce((s, a) => s + a.tokensUsed, 0) * mul)
  const avgSuccess  = MY_AGENTS.reduce((s, a) => s + a.successRate, 0) / MY_AGENTS.length
  const avgLatency  = MY_AGENTS.reduce((s, a) => s + a.avgLatency, 0) / MY_AGENTS.length

  const agentFilters = ["Todos", ...MY_AGENTS.map((a) => a.name)]
  const filteredExecs = MY_EXECUTIONS.filter(
    (e) => selectedAgentFilter === "Todos" || e.agentName === selectedAgentFilter
  )

  const scaledTokenUsage = TOKEN_USAGE.map((t) => ({ ...t, value: Math.round(t.value * mul) }))
  const maxToken = Math.max(...scaledTokenUsage.map((t) => t.value))

  return (
    <div className="flex flex-col h-full" style={{ background: "#F7F8FA" }}>

      {/* Page header */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b shrink-0 gap-4 flex-wrap"
        style={{ background: "#FFFFFF", borderColor: "rgba(145,158,171,0.16)" }}
      >
        <div>
          <h1 className="text-lg font-bold" style={{ color: "#1C2434" }}>Mi Observabilidad</h1>
          <p className="text-sm mt-0.5" style={{ color: "#637381" }}>
            Trazabilidad y métricas de tus agentes CORE
          </p>
        </div>

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
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-5 space-y-5">

          {/* KPI strip */}
          <div className="flex gap-4">
            <KpiCard label="Mis ejecuciones"   value={kfmt(totalExecs)}              sub={currentRange.periodLabel} icon={Activity}   />
            <KpiCard label="Tokens consumidos"  value={kfmt(totalTokens)}             sub={currentRange.periodLabel} icon={Zap}        accent="#5E24D5" />
            <KpiCard label="Tasa de éxito"      value={`${avgSuccess.toFixed(1)}%`}   sub="Promedio de agentes"      icon={TrendingUp} accent="#16A34A" />
            <KpiCard label="Latencia promedio"  value={`${Math.round(avgLatency)}ms`} sub="Por ejecución"            icon={Clock}      accent="#0891B2" />
          </div>

          {/* My agents status row */}
          <div>
            <p className="text-sm font-semibold mb-3" style={{ color: "#1C2434" }}>Mis agentes CORE</p>
            <div className="flex gap-4">
              {MY_AGENTS.map((agent) => (
                <div
                  key={agent.id}
                  className="flex-1 rounded-2xl border p-4"
                  style={{
                    background: "#FFFFFF",
                    borderColor: agent.status === "error"
                      ? "rgba(239,68,68,0.3)"
                      : "rgba(145,158,171,0.16)",
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-7 w-7 rounded-lg flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg,#D4009A18,#5E24D518)" }}
                      >
                        <Bot className="h-3.5 w-3.5" style={{ color: "#D4009A" }} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: "#1C2434" }}>{agent.name}</p>
                        <p className="text-[10px]" style={{ color: "#9AA3B0" }}>{agent.model}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{
                          background: agent.status === "active" ? "#16A34A"
                            : agent.status === "error" ? "#DC2626" : "#D97706"
                        }}
                      />
                      <span className="text-[10px]" style={{
                        color: agent.status === "active" ? "#16A34A"
                          : agent.status === "error" ? "#DC2626" : "#D97706"
                      }}>
                        {agent.status === "active" ? "Activo" : agent.status === "error" ? "Error" : "Inactivo"}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    <div>
                      <p className="text-[10px]" style={{ color: "#9AA3B0" }}>Ejecuciones</p>
                      <p className="text-sm font-bold" style={{ color: "#1C2434" }}>{kfmt(agent.executions)}</p>
                    </div>
                    <div>
                      <p className="text-[10px]" style={{ color: "#9AA3B0" }}>Éxito</p>
                      <p className="text-sm font-bold" style={{
                        color: agent.successRate >= 95 ? "#16A34A" : agent.successRate >= 85 ? "#D97706" : "#DC2626"
                      }}>
                        {agent.successRate}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px]" style={{ color: "#9AA3B0" }}>Latencia</p>
                      <p className="text-sm font-bold" style={{ color: "#1C2434" }}>{agent.avgLatency}ms</p>
                    </div>
                    <div>
                      <p className="text-[10px]" style={{ color: "#9AA3B0" }}>Tokens</p>
                      <p className="text-sm font-bold" style={{ color: "#1C2434" }}>{kfmt(agent.tokensUsed)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Token usage chart */}
          <div
            className="rounded-2xl border p-5"
            style={{ background: "#FFFFFF", borderColor: "rgba(145,158,171,0.16)" }}
          >
            <p className="text-sm font-semibold mb-4" style={{ color: "#1C2434" }}>
              Consumo de tokens por agente
            </p>
            <div className="space-y-3">
              {scaledTokenUsage.map((t) => (
                <div key={t.label} className="flex items-center gap-3">
                  <span className="text-xs w-24 shrink-0 font-medium" style={{ color: "#454F5B" }}>{t.label}</span>
                  <div className="flex-1 h-2.5 rounded-full" style={{ background: "#F1F5F9" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(t.value / maxToken) * 100}%`, background: t.color }}
                    />
                  </div>
                  <span className="text-xs font-semibold w-12 text-right" style={{ color: "#1C2434" }}>
                    {kfmt(t.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Execution timeline */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold" style={{ color: "#1C2434" }}>
                Historial de ejecuciones
              </p>
              {/* Agent filter pills */}
              <div className="flex items-center gap-1.5">
                {agentFilters.map((f) => (
                  <button
                    key={f}
                    onClick={() => setSelectedAgentFilter(f)}
                    className="text-xs px-3 py-1 rounded-lg font-medium transition-all"
                    style={selectedAgentFilter === f
                      ? { background: "#0F2870", color: "#FFFFFF" }
                      : { background: "#FFFFFF", color: "#637381", border: "1px solid rgba(145,158,171,0.24)" }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2.5">
              {filteredExecs.map((exec) => (
                <ExecutionRow key={exec.id} exec={exec} />
              ))}
              {filteredExecs.length === 0 && (
                <div className="text-center py-10 rounded-2xl border"
                  style={{ borderColor: "rgba(145,158,171,0.16)", background: "#FFFFFF" }}>
                  <p className="text-sm" style={{ color: "#9AA3B0" }}>No hay ejecuciones para este agente</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
