"use client"

import { useState } from "react"
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  Bot,
  ShieldCheck,
  Cpu,
  ThumbsUp,
  ThumbsDown,
  Zap,
  Settings,
  Plus,
  ChevronRight,
  X,
  TrendingUp,
  Activity,
} from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────────────────

type EvalScore = number | "positive" | "negative"

type SubAgentType = "generation·final" | "guardrail" | "agent·orquestador" | "trace·completa"

interface AgentEval {
  id: string
  name: string
  compositeScore: number
  respuestaFinal: number
  guardrail: number
  orquestador: number
  satisfaccion: number // 0–100 %
}

interface Evaluador {
  id: string
  name: string
  type: "llm-judge" | "manual"
  subtype: string
  status: "active" | "paused"
  description: string
  accentColor: string
  targetType: SubAgentType
}

interface EvalRow {
  id: string
  conversationId: string
  agentName: string
  evaluadorName: string
  subAgentType: SubAgentType
  score: EvalScore
  reasoning: string
  hora: string
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const AGENTS: AgentEval[] = [
  {
    id: "a1", name: "Agente Ventas",
    compositeScore: 0.91,
    respuestaFinal: 0.93, guardrail: 0.97, orquestador: 0.88, satisfaccion: 84,
  },
  {
    id: "a2", name: "Agente Soporte",
    compositeScore: 0.77,
    respuestaFinal: 0.79, guardrail: 0.92, orquestador: 0.71, satisfaccion: 68,
  },
  {
    id: "a3", name: "Agente Reportes",
    compositeScore: 0.44,
    respuestaFinal: 0.41, guardrail: 0.78, orquestador: 0.38, satisfaccion: 52,
  },
]

const EVALUADORES: Evaluador[] = [
  {
    id: "ev1",
    name: "Calidad de respuesta final",
    type: "llm-judge",
    subtype: "observation-level · tipo: generation",
    status: "active",
    description: "Evalúa coherencia, utilidad y completitud de la respuesta final entregada al usuario. Score bajo indica respuestas vagas o incorrectas.",
    accentColor: "#16A34A",
    targetType: "generation·final",
  },
  {
    id: "ev2",
    name: "Precisión del guardrail",
    type: "llm-judge",
    subtype: "observation-level · tipo: guardrail",
    status: "active",
    description: "Detecta falsos positivos (bloqueos innecesarios) y falsos negativos (contenido inapropiado que pasó). Score bajo = guardrail mal calibrado.",
    accentColor: "#D97706",
    targetType: "guardrail",
  },
  {
    id: "ev3",
    name: "Coherencia del orquestador",
    type: "llm-judge",
    subtype: "observation-level · tipo: agent",
    status: "active",
    description: "Mide si el orquestador eligió los sub-agentes correctos y en el orden adecuado para resolver la consulta. Score bajo indica routing deficiente.",
    accentColor: "#0891B2",
    targetType: "agent·orquestador",
  },
  {
    id: "ev4",
    name: "Feedback de usuario",
    type: "manual",
    subtype: "trace-level",
    status: "active",
    description: "Votos 👍/👎 que los usuarios dejan desde el Playground sobre la traza completa. Fuente directa de satisfacción real.",
    accentColor: "#7C3AED",
    targetType: "trace·completa",
  },
]

const EVAL_ROWS: EvalRow[] = [
  {
    id: "r1", conversationId: "conv-4821", agentName: "Agente Ventas",
    evaluadorName: "Calidad de respuesta final", subAgentType: "generation·final",
    score: 0.94,
    reasoning: "La respuesta cubre todos los puntos clave del contrato enterprise con terminología precisa. No hay ambigüedades ni información faltante.",
    hora: "hace 2 min",
  },
  {
    id: "r2", conversationId: "conv-4820", agentName: "Agente Soporte",
    evaluadorName: "Precisión del guardrail", subAgentType: "guardrail",
    score: 0.61,
    reasoning: "El guardrail bloqueó una consulta legítima sobre políticas de devolución, generando fricción innecesaria para el usuario.",
    hora: "hace 5 min",
  },
  {
    id: "r3", conversationId: "conv-4819", agentName: "Agente Ventas",
    evaluadorName: "Feedback de usuario", subAgentType: "trace·completa",
    score: "positive",
    reasoning: "El usuario votó positivo. Comentario: 'Muy claro y rápido, resolvió mi duda al primer intento.'",
    hora: "hace 8 min",
  },
  {
    id: "r4", conversationId: "conv-4818", agentName: "Agente Reportes",
    evaluadorName: "Coherencia del orquestador", subAgentType: "agent·orquestador",
    score: 0.31,
    reasoning: "El orquestador invocó el sub-agente de herramientas antes de consultar la base de conocimiento, resultando en una respuesta incompleta que requirió retry.",
    hora: "hace 12 min",
  },
  {
    id: "r5", conversationId: "conv-4817", agentName: "Agente Soporte",
    evaluadorName: "Calidad de respuesta final", subAgentType: "generation·final",
    score: 0.82,
    reasoning: "Respuesta correcta pero demasiado técnica para un usuario final. Podría mejorarse con lenguaje más accesible.",
    hora: "hace 15 min",
  },
  {
    id: "r6", conversationId: "conv-4816", agentName: "Agente Reportes",
    evaluadorName: "Feedback de usuario", subAgentType: "trace·completa",
    score: "negative",
    reasoning: "El usuario votó negativo. Comentario: 'No entendí la respuesta, fue muy confusa y no respondió lo que pregunté.'",
    hora: "hace 19 min",
  },
  {
    id: "r7", conversationId: "conv-4815", agentName: "Agente Ventas",
    evaluadorName: "Precisión del guardrail", subAgentType: "guardrail",
    score: 0.97,
    reasoning: "Guardrail actuó correctamente, permitiendo la consulta comercial sin bloqueos innecesarios y sin dejar pasar contenido sensible.",
    hora: "hace 24 min",
  },
  {
    id: "r8", conversationId: "conv-4814", agentName: "Agente Soporte",
    evaluadorName: "Coherencia del orquestador", subAgentType: "agent·orquestador",
    score: 0.73,
    reasoning: "El routing fue correcto pero el orquestador tardó dos iteraciones en determinar qué colección usar para responder.",
    hora: "hace 31 min",
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: EvalScore): string {
  if (score === "positive") return "#16A34A"
  if (score === "negative") return "#DC2626"
  if (score >= 0.8) return "#16A34A"
  if (score >= 0.5) return "#D97706"
  return "#DC2626"
}

function scoreBg(score: EvalScore): string {
  if (score === "positive") return "#F0FDF4"
  if (score === "negative") return "#FEF2F2"
  if (score >= 0.8) return "#F0FDF4"
  if (score >= 0.5) return "#FFFBEB"
  return "#FEF2F2"
}

function scoreLabel(score: EvalScore): string {
  if (score === "positive") return "positivo"
  if (score === "negative") return "negativo"
  return score.toFixed(2)
}

function compositeChipColors(score: number) {
  if (score >= 0.8) return { bg: "#F0FDF4", text: "#16A34A" }
  if (score >= 0.5) return { bg: "#FFFBEB", text: "#D97706" }
  return { bg: "#FEF2F2", text: "#DC2626" }
}

const SUB_AGENT_META: Record<SubAgentType, { label: string; bg: string; color: string }> = {
  "generation·final":    { label: "generation · final",      bg: "rgba(124,58,237,0.08)",  color: "#7C3AED" },
  "guardrail":           { label: "guardrail",                bg: "rgba(217,119,6,0.08)",   color: "#D97706" },
  "agent·orquestador":   { label: "agent · orquestador",      bg: "rgba(8,145,178,0.08)",   color: "#0891B2" },
  "trace·completa":      { label: "trace · completa",         bg: "rgba(22,163,74,0.08)",   color: "#16A34A" },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreBar({ value, isPercent = false }: { value: number; isPercent?: boolean }) {
  const pct = isPercent ? value : value * 100
  const color = isPercent
    ? value >= 80 ? "#16A34A" : value >= 50 ? "#D97706" : "#DC2626"
    : value >= 0.8 ? "#16A34A" : value >= 0.5 ? "#D97706" : "#DC2626"
  return (
    <div className="flex-1 h-1.5 rounded-full" style={{ background: "#F1F5F9" }}>
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  )
}

function EvaluadorCard({ ev }: { ev: Evaluador }) {
  return (
    <div
      className="rounded-xl border flex overflow-hidden"
      style={{ background: "#FFFFFF", borderColor: "rgba(145,158,171,0.16)" }}
    >
      {/* Accent bar */}
      <div className="w-1 shrink-0" style={{ background: ev.accentColor }} />
      <div className="flex-1 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold" style={{ color: "#1C2434" }}>{ev.name}</span>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={ev.status === "active"
                  ? { background: "#F0FDF4", color: "#16A34A" }
                  : { background: "#FFFBEB", color: "#D97706" }}
              >
                {ev.status === "active" ? "activo" : "pausado"}
              </span>
            </div>
            <p className="text-[11px] mt-0.5" style={{ color: "#9AA3B0" }}>
              {ev.type === "llm-judge" ? "LLM-as-judge" : "Manual · \uD83D\uDC4D/\uD83D\uDC4E"} · {ev.subtype}
            </p>
          </div>
        </div>
        <p className="text-xs mt-2 leading-relaxed" style={{ color: "#637381" }}>
          {ev.description}
        </p>
      </div>
    </div>
  )
}

function TraceDetailPanel({ row, onClose }: { row: EvalRow; onClose: () => void }) {
  const meta = SUB_AGENT_META[row.subAgentType]
  return (
    <div
      className="w-[380px] shrink-0 border-l flex flex-col h-full overflow-y-auto"
      style={{ background: "#FFFFFF", borderColor: "rgba(145,158,171,0.16)" }}
    >
      <div
        className="flex items-center justify-between px-5 py-4 border-b shrink-0"
        style={{ borderColor: "rgba(145,158,171,0.12)" }}
      >
        <div>
          <p className="text-sm font-semibold" style={{ color: "#1C2434" }}>Detalle de evaluación</p>
          <p className="text-xs mt-0.5" style={{ color: "#637381" }}>{row.conversationId} · {row.agentName}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg transition-colors hover:bg-slate-100"
          style={{ color: "#637381" }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-5 flex flex-col gap-5">
        {/* Evaluador info */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "#9AA3B0" }}>Evaluador</p>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium" style={{ color: "#1C2434" }}>{row.evaluadorName}</span>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <span
              className="text-[11px] font-medium px-2 py-0.5 rounded-full"
              style={{ background: meta.bg, color: meta.color }}
            >
              {meta.label}
            </span>
          </div>
        </div>

        {/* Score */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "#9AA3B0" }}>Score</p>
          <div className="flex items-center gap-3">
            <span
              className="text-2xl font-bold px-3 py-1 rounded-xl"
              style={{ background: scoreBg(row.score), color: scoreColor(row.score) }}
            >
              {scoreLabel(row.score)}
            </span>
            {row.score === "positive" && <ThumbsUp className="h-5 w-5" style={{ color: "#16A34A" }} />}
            {row.score === "negative" && <ThumbsDown className="h-5 w-5" style={{ color: "#DC2626" }} />}
          </div>
        </div>

        {/* Reasoning */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "#9AA3B0" }}>
            Razonamiento del juez
          </p>
          <div
            className="rounded-xl p-4 text-sm leading-relaxed"
            style={{ background: "#F7F8FA", color: "#454F5B", borderLeft: "3px solid #E9ECEE" }}
          >
            {row.reasoning}
          </div>
        </div>

        {/* Hora */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: "#9AA3B0" }}>Tiempo</p>
          <p className="text-sm" style={{ color: "#637381" }}>{row.hora}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Main view ────────────────────────────────────────────────────────────────

export function EvaluacionesView() {
  const [agentFilter, setAgentFilter] = useState<string>("todos")
  const [subAgentFilter, setSubAgentFilter] = useState<string>("todos")
  const [scoreFilter, setScoreFilter] = useState<string>("todos")
  const [selectedRow, setSelectedRow] = useState<EvalRow | null>(null)

  // KPI aggregates
  const totalEvals     = EVAL_ROWS.length
  const numericScores  = EVAL_ROWS.map((r) => r.score).filter((s): s is number => typeof s === "number")
  const avgScore       = numericScores.reduce((a, b) => a + b, 0) / numericScores.length
  const guardrailLow   = EVAL_ROWS.filter(
    (r) => r.subAgentType === "guardrail" && typeof r.score === "number" && r.score < 0.7
  ).length
  const positiveVotes  = EVAL_ROWS.filter((r) => r.score === "positive").length
  const totalVotes     = EVAL_ROWS.filter((r) => r.score === "positive" || r.score === "negative").length
  const satisfaccion   = totalVotes > 0 ? Math.round((positiveVotes / totalVotes) * 100) : 0

  const filteredRows = EVAL_ROWS.filter((r) => {
    const matchAgent = agentFilter === "todos" || r.agentName === agentFilter
    const matchSub   = subAgentFilter === "todos" || r.subAgentType === subAgentFilter
    const matchScore = scoreFilter === "todos"
      ? true
      : scoreFilter === "high"   ? (typeof r.score === "number" && r.score >= 0.8) || r.score === "positive"
      : scoreFilter === "medium" ? typeof r.score === "number" && r.score >= 0.5 && r.score < 0.8
      :                            (typeof r.score === "number" && r.score < 0.5) || r.score === "negative"
    return matchAgent && matchSub && matchScore
  })

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Page header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b shrink-0 gap-4 flex-wrap"
          style={{ background: "#FFFFFF", borderColor: "rgba(145,158,171,0.16)" }}
        >
          <div>
            <h1 className="text-lg font-bold" style={{ color: "#1C2434" }}>Evaluaciones</h1>
            <p className="text-sm mt-0.5" style={{ color: "#637381" }}>
              Calidad de tus agentes CORE en produccion — respuesta final y cada sub-agente del grafo
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Agent selector */}
            <div className="relative">
              <select
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value)}
                className="appearance-none text-sm pl-3 pr-8 py-2 rounded-xl border outline-none"
                style={{
                  background: "#FFFFFF",
                  borderColor: "rgba(145,158,171,0.24)",
                  color: "#1C2434",
                }}
              >
                <option value="todos">Todos mis agentes CORE</option>
                {AGENTS.map((a) => (
                  <option key={a.id} value={a.name}>{a.name}</option>
                ))}
              </select>
              <ChevronDown className="h-3.5 w-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#637381" }} />
            </div>
            {/* New evaluator button */}
            <button
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors"
              style={{ background: "#D4009A" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#A4097B")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#D4009A")}
            >
              <Plus className="h-4 w-4" />
              Nuevo evaluador
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">

          {/* ── KPI strip ──────────────────────────────────────────────────── */}
          <div className="grid grid-cols-4 gap-4">
            {/* Evaluaciones hoy */}
            <div className="rounded-2xl border p-5 flex flex-col gap-3" style={{ background: "#FFFFFF", borderColor: "rgba(145,158,171,0.16)" }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: "#637381" }}>Evaluaciones hoy</span>
                <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(212,0,154,0.08)" }}>
                  <Activity className="h-4 w-4" style={{ color: "#D4009A" }} />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: "#1C2434" }}>{totalEvals}</p>
                <p className="text-xs mt-0.5" style={{ color: "#637381" }}>automaticas + manuales</p>
              </div>
            </div>

            {/* Score promedio */}
            <div className="rounded-2xl border p-5 flex flex-col gap-3" style={{ background: "#FFFFFF", borderColor: "rgba(145,158,171,0.16)" }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: "#637381" }}>Score promedio global</span>
                <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(22,163,74,0.08)" }}>
                  <TrendingUp className="h-4 w-4" style={{ color: "#16A34A" }} />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: scoreColor(avgScore) }}>{avgScore.toFixed(2)}</p>
                <p className="text-xs mt-0.5" style={{ color: "#637381" }}>sobre todos los agentes</p>
              </div>
            </div>

            {/* Guardrails problemáticos */}
            <div className="rounded-2xl border p-5 flex flex-col gap-3" style={{ background: "#FFFFFF", borderColor: "rgba(145,158,171,0.16)" }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: "#637381" }}>Guardrails problematicos</span>
                <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(220,38,38,0.08)" }}>
                  <ShieldCheck className="h-4 w-4" style={{ color: "#DC2626" }} />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: guardrailLow > 0 ? "#DC2626" : "#16A34A" }}>{guardrailLow}</p>
                <p className="text-xs mt-0.5" style={{ color: "#637381" }}>falsos positivos detectados</p>
              </div>
            </div>

            {/* Satisfacción usuarios */}
            <div className="rounded-2xl border p-5 flex flex-col gap-3" style={{ background: "#FFFFFF", borderColor: "rgba(145,158,171,0.16)" }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: "#637381" }}>Satisfaccion usuarios</span>
                <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.08)" }}>
                  <ThumbsUp className="h-4 w-4" style={{ color: "#7C3AED" }} />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: "#7C3AED" }}>{satisfaccion}%</p>
                <p className="text-xs mt-0.5" style={{ color: "#637381" }}>votos en el Playground</p>
              </div>
            </div>
          </div>

          {/* ── Two-column panel ───────────────────────────────────────────── */}
          <div className="grid gap-4" style={{ gridTemplateColumns: "60fr 40fr" }}>

            {/* Left: scores by agent */}
            <div
              className="rounded-2xl border p-5 flex flex-col gap-1"
              style={{ background: "#FFFFFF", borderColor: "rgba(145,158,171,0.16)" }}
            >
              <p className="text-sm font-semibold mb-4" style={{ color: "#1C2434" }}>
                Por agente CORE — score compuesto
              </p>

              {AGENTS.map((agent, idx) => {
                const chip = compositeChipColors(agent.compositeScore)
                return (
                  <div key={agent.id}>
                    {idx > 0 && (
                      <div className="my-4" style={{ height: "1px", background: "rgba(145,158,171,0.12)" }} />
                    )}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm font-semibold" style={{ color: "#1C2434" }}>{agent.name}</span>
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: chip.bg, color: chip.text }}
                      >
                        {agent.compositeScore.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {/* Respuesta final */}
                      <div className="flex items-center gap-3">
                        <span className="text-xs shrink-0" style={{ width: "110px", color: "#637381" }}>Respuesta final</span>
                        <ScoreBar value={agent.respuestaFinal} />
                        <span className="text-xs font-semibold shrink-0 text-right" style={{ width: "36px", color: scoreColor(agent.respuestaFinal) }}>
                          {agent.respuestaFinal.toFixed(2)}
                        </span>
                      </div>
                      {/* Guardrail */}
                      <div className="flex items-center gap-3">
                        <span className="text-xs shrink-0" style={{ width: "110px", color: "#637381" }}>Guardrail</span>
                        <ScoreBar value={agent.guardrail} />
                        <span className="text-xs font-semibold shrink-0 text-right" style={{ width: "36px", color: scoreColor(agent.guardrail) }}>
                          {agent.guardrail.toFixed(2)}
                        </span>
                      </div>
                      {/* Orquestador */}
                      <div className="flex items-center gap-3">
                        <span className="text-xs shrink-0" style={{ width: "110px", color: "#637381" }}>Orquestador</span>
                        <ScoreBar value={agent.orquestador} />
                        <span className="text-xs font-semibold shrink-0 text-right" style={{ width: "36px", color: scoreColor(agent.orquestador) }}>
                          {agent.orquestador.toFixed(2)}
                        </span>
                      </div>
                      {/* Satisfacción */}
                      <div className="flex items-center gap-3">
                        <span className="text-xs shrink-0" style={{ width: "110px", color: "#637381" }}>Satisfaccion</span>
                        <ScoreBar value={agent.satisfaccion} isPercent />
                        <span className="text-xs font-semibold shrink-0 text-right" style={{ width: "36px", color: scoreColor(agent.satisfaccion / 100) }}>
                          {agent.satisfaccion}%
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Right: active evaluators */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold" style={{ color: "#1C2434" }}>Evaluadores activos</p>
                <button
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition-colors"
                  style={{ borderColor: "rgba(145,158,171,0.24)", color: "#637381", background: "#FFFFFF" }}
                >
                  <Settings className="h-3.5 w-3.5" />
                  Configurar
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {EVALUADORES.map((ev) => (
                  <EvaluadorCard key={ev.id} ev={ev} />
                ))}
              </div>
            </div>
          </div>

          {/* ── Realtime evaluation table ──────────────────────────────────── */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ background: "#FFFFFF", borderColor: "rgba(145,158,171,0.16)" }}
          >
            {/* Table header */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: "rgba(145,158,171,0.12)" }}
            >
              <div>
                <p className="text-sm font-semibold" style={{ color: "#1C2434" }}>
                  Ultimas evaluaciones — produccion en tiempo real
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#637381" }}>
                  Click en una fila para ver el detalle de la traza
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Sub-agent filter */}
                <div className="relative">
                  <select
                    value={subAgentFilter}
                    onChange={(e) => setSubAgentFilter(e.target.value)}
                    className="appearance-none text-xs pl-3 pr-7 py-1.5 rounded-lg border outline-none"
                    style={{ borderColor: "rgba(145,158,171,0.24)", color: "#1C2434", background: "#FFFFFF" }}
                  >
                    <option value="todos">Todos los sub-agentes</option>
                    <option value="generation·final">generation · final</option>
                    <option value="guardrail">guardrail</option>
                    <option value="agent·orquestador">agent · orquestador</option>
                    <option value="trace·completa">trace · completa</option>
                  </select>
                  <ChevronDown className="h-3 w-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#637381" }} />
                </div>
                {/* Score filter */}
                <div className="relative">
                  <select
                    value={scoreFilter}
                    onChange={(e) => setScoreFilter(e.target.value)}
                    className="appearance-none text-xs pl-3 pr-7 py-1.5 rounded-lg border outline-none"
                    style={{ borderColor: "rgba(145,158,171,0.24)", color: "#1C2434", background: "#FFFFFF" }}
                  >
                    <option value="todos">Todos los scores</option>
                    <option value="high">Alto ≥ 0.8 / positivo</option>
                    <option value="medium">Medio 0.5–0.8</option>
                    <option value="low">Bajo {"<"} 0.5 / negativo</option>
                  </select>
                  <ChevronDown className="h-3 w-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#637381" }} />
                </div>
              </div>
            </div>

            {/* Table */}
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ background: "#F7F8FA" }}>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold" style={{ color: "#637381" }}>Conversacion / agente</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold" style={{ color: "#637381" }}>Evaluador</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold" style={{ color: "#637381" }}>Sub-agente evaluado</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold" style={{ color: "#637381" }}>Score</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold" style={{ color: "#637381" }}>Razonamiento del juez</th>
                  <th className="text-right px-5 py-2.5 text-xs font-semibold" style={{ color: "#637381" }}>Hora</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const meta = SUB_AGENT_META[row.subAgentType]
                  const isSelected = selectedRow?.id === row.id
                  return (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedRow(isSelected ? null : row)}
                      className="cursor-pointer transition-colors border-t"
                      style={{
                        borderColor: "rgba(145,158,171,0.1)",
                        background: isSelected ? "#FFF0FA" : undefined,
                      }}
                      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "#F7F8FA" }}
                      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "" }}
                    >
                      {/* Conversation / agent */}
                      <td className="px-5 py-3">
                        <p className="text-xs font-bold" style={{ color: "#1C2434" }}>{row.conversationId}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: "#637381" }}>{row.agentName}</p>
                      </td>
                      {/* Evaluador */}
                      <td className="px-4 py-3">
                        <p className="text-xs" style={{ color: "#637381" }}>{row.evaluadorName}</p>
                      </td>
                      {/* Sub-agent chip */}
                      <td className="px-4 py-3">
                        <span
                          className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                          style={{ background: meta.bg, color: meta.color }}
                        >
                          {meta.label}
                        </span>
                      </td>
                      {/* Score chip */}
                      <td className="px-4 py-3">
                        <span
                          className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                          style={{ background: scoreBg(row.score), color: scoreColor(row.score) }}
                        >
                          {scoreLabel(row.score)}
                        </span>
                      </td>
                      {/* Reasoning */}
                      <td className="px-4 py-3 max-w-xs">
                        <p
                          className="text-xs leading-relaxed overflow-hidden"
                          style={{
                            color: "#637381",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {row.reasoning}
                        </p>
                      </td>
                      {/* Hora */}
                      <td className="px-5 py-3 text-right">
                        <p className="text-xs" style={{ color: "#9AA3B0" }}>{row.hora}</p>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {filteredRows.length === 0 && (
              <div className="px-5 py-10 text-center">
                <p className="text-sm" style={{ color: "#9AA3B0" }}>No hay evaluaciones para los filtros seleccionados.</p>
              </div>
            )}
          </div>

          {/* ── Offline evaluation CTA banner ─────────────────────────────── */}
          <div
            className="rounded-2xl p-5 flex items-center justify-between gap-4"
            style={{
              border: "1.5px dashed rgba(212,0,154,0.3)",
              background: "rgba(212,0,154,0.03)",
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(212,0,154,0.08)" }}
              >
                <Zap className="h-5 w-5" style={{ color: "#D4009A" }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "#1C2434" }}>
                  Evaluacion offline sobre tu historial
                </p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: "#637381" }}>
                  Corre tus evaluadores sobre trazas pasadas para detectar regresiones, calibrar nuevos modelos
                  o validar cambios en los prompts antes de desplegar. Selecciona un rango de trazas y un evaluador.
                </p>
              </div>
            </div>
            <button
              className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors whitespace-nowrap"
              style={{ borderColor: "#D4009A", color: "#D4009A", background: "#FFFFFF" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(212,0,154,0.06)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#FFFFFF"
              }}
            >
              <ChevronRight className="h-4 w-4" />
              Iniciar evaluacion offline
            </button>
          </div>

        </div>
      </div>

      {/* ── Trace detail panel ─────────────────────────────────────────────── */}
      {selectedRow && (
        <TraceDetailPanel row={selectedRow} onClose={() => setSelectedRow(null)} />
      )}
    </div>
  )
}
