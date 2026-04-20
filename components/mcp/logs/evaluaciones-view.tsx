"use client"

import { useState } from "react"
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ShieldCheck,
  ThumbsUp,
  ThumbsDown,
  X,
  TrendingUp,
  Activity,
  BarChart3,
  Users,
  Bot,
  BookOpen,
  MessageSquare,
  Send,
  ChevronRight,
  Info,
  Zap,
  RefreshCw,
} from "lucide-react"

// ─── Tab type ────────────────────────────────────────────────────────────────
type EvalTab = "metricas" | "humana" | "llm-judge" | "rag"

const TABS: { id: EvalTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "metricas",  label: "Metricas",            icon: BarChart3     },
  { id: "humana",    label: "Evaluacion humana",   icon: Users         },
  { id: "llm-judge", label: "LLM como juez",       icon: Bot           },
  { id: "rag",       label: "Fiabilidad RAG",      icon: BookOpen      },
]

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

// ─── Mock data: Human evaluation queue ────────────────────────────────────────

interface HumanEvalItem {
  id: string
  conversationId: string
  agentName: string
  userQuery: string
  agentResponse: string
  hora: string
  status: "pending" | "done"
  verdict?: "positive" | "negative"
  comment?: string
}

const HUMAN_QUEUE: HumanEvalItem[] = [
  {
    id: "h1", conversationId: "conv-5512", agentName: "Agente Soporte",
    userQuery: "Mi factura de marzo tiene un cobro extra que no reconozco, necesito que me expliquen de donde viene.",
    agentResponse: "Entiendo tu preocupacion. Revisando tu cuenta veo que el cargo adicional corresponde al servicio de soporte prioritario activado el 14 de marzo. Si no lo reconoces puedo escalar el caso a nuestro equipo de facturacion para un reembolso.",
    hora: "Hace 5 min", status: "pending",
  },
  {
    id: "h2", conversationId: "conv-5498", agentName: "Agente Ventas",
    userQuery: "Quiero saber si el plan empresarial incluye integraciones con Salesforce y cuanto cuesta.",
    agentResponse: "El plan empresarial incluye integracion nativa con Salesforce CRM, HubSpot y Pipedrive. El precio parte desde $299/mes para hasta 10 usuarios. Te puedo agendar una demo con un ejecutivo de cuentas esta semana.",
    hora: "Hace 12 min", status: "pending",
  },
  {
    id: "h3", conversationId: "conv-5471", agentName: "Agente Reportes",
    userQuery: "Genera un resumen de las ventas del Q1 por region.",
    agentResponse: "No tengo acceso a los datos de ventas del Q1 en este momento. Por favor contacta al area de BI o exporta el reporte desde el dashboard de analytics.",
    hora: "Hace 28 min", status: "pending",
  },
  {
    id: "h4", conversationId: "conv-5430", agentName: "Agente Soporte",
    userQuery: "Como puedo restablecer mi contrasena de acceso al portal?",
    agentResponse: "Para restablecer tu contrasena ve a la pagina de inicio de sesion y haz click en 'Olvide mi contrasena'. Recibiras un correo con el enlace en menos de 5 minutos. Si no llega revisa tu carpeta de spam.",
    hora: "Hace 1 hora", status: "done", verdict: "positive", comment: "Respuesta correcta y clara.",
  },
  {
    id: "h5", conversationId: "conv-5401", agentName: "Agente Ventas",
    userQuery: "Tienen descuento para startups o empresas pequeñas?",
    agentResponse: "Si, ofrecemos un 30% de descuento para startups con menos de 2 anos de operacion y menos de 50 empleados. Tambien tenemos un programa para ONGs. Puedo enviarte el formulario de aplicacion.",
    hora: "Hace 2 horas", status: "done", verdict: "positive",
  },
]

// ─── Mock data: LLM Judge configs ─────────────────────────────────────────────

interface JudgeConfig {
  id: string
  name: string
  targetSubAgent: string
  model: string
  prompt: string
  lastRunScore: number
  runsToday: number
  accentColor: string
}

const JUDGE_CONFIGS: JudgeConfig[] = [
  {
    id: "j1",
    name: "Calidad de respuesta final",
    targetSubAgent: "generation · final",
    model: "gpt-4o",
    prompt: `Eres un evaluador experto de asistentes de IA. Evalua la siguiente respuesta en una escala de 0 a 1 considerando:
- Completitud: responde todo lo que el usuario pregunto?
- Precision: la informacion es correcta y verificable?
- Claridad: es facil de entender para un usuario no tecnico?
- Tono: es apropiado, profesional y empatico?

Responde en JSON con el formato: { "score": 0.0, "reasoning": "..." }`,
    lastRunScore: 0.91,
    runsToday: 842,
    accentColor: "#16A34A",
  },
  {
    id: "j2",
    name: "Precision del guardrail",
    targetSubAgent: "guardrail",
    model: "gpt-4o-mini",
    prompt: `Evalua si el guardrail tomo la decision correcta. Considera:
- Falso positivo: bloqueo una consulta legitima?
- Falso negativo: dejo pasar contenido inapropiado?
- Proporcionalidad: la severidad del bloqueo es adecuada?

Responde en JSON: { "score": 0.0, "reasoning": "...", "tipo_error": "ninguno|falso_positivo|falso_negativo" }`,
    lastRunScore: 0.94,
    runsToday: 312,
    accentColor: "#D97706",
  },
  {
    id: "j3",
    name: "Coherencia del orquestador",
    targetSubAgent: "agent · orquestador",
    model: "gpt-4o",
    prompt: `Evalua si el orquestador eligio los sub-agentes correctos y en el orden adecuado. Considera:
- Seleccion: eligio los sub-agentes pertinentes para la tarea?
- Orden: el flujo de ejecucion fue logico?
- Eficiencia: invoco sub-agentes innecesarios?

Responde en JSON: { "score": 0.0, "reasoning": "..." }`,
    lastRunScore: 0.78,
    runsToday: 527,
    accentColor: "#0891B2",
  },
]

// ─── Mock data: RAG reliability ───────────────────────────────────────────────

interface RagMetric {
  id: string
  name: string
  description: string
  score: number
  trend: "up" | "down" | "neutral"
  trendValue: string
  accentColor: string
}

const RAG_METRICS: RagMetric[] = [
  {
    id: "faithfulness",
    name: "Faithfulness",
    description: "Que tan fiel es la respuesta al contexto recuperado. Un score bajo indica que el agente RAG esta 'alucinando' informacion que no estaba en los documentos recuperados.",
    score: 0.87,
    trend: "up", trendValue: "+0.04 vs semana pasada",
    accentColor: "#16A34A",
  },
  {
    id: "context-precision",
    name: "Context Precision",
    description: "Que porcentaje de los chunks recuperados eran realmente relevantes para la pregunta. Un score bajo indica que el retrieval esta trayendo demasiado ruido.",
    score: 0.72,
    trend: "down", trendValue: "-0.06 vs semana pasada",
    accentColor: "#D97706",
  },
  {
    id: "context-recall",
    name: "Context Recall",
    description: "Que tan completa es la recuperacion: se trajeron todos los chunks relevantes? Un score bajo implica que falta informacion clave en el contexto.",
    score: 0.81,
    trend: "neutral", trendValue: "Sin cambio",
    accentColor: "#0891B2",
  },
  {
    id: "answer-relevance",
    name: "Answer Relevance",
    description: "Que tan relevante es la respuesta final respecto a la pregunta original del usuario, independientemente del contexto recuperado.",
    score: 0.93,
    trend: "up", trendValue: "+0.02 vs semana pasada",
    accentColor: "#7C3AED",
  },
]

interface RagTrace {
  id: string
  query: string
  retrievedChunks: number
  relevantChunks: number
  faithfulness: number
  answerRelevance: number
  hora: string
}

const RAG_TRACES: RagTrace[] = [
  { id: "rt1", query: "Cual es la politica de reembolso para productos digitales?", retrievedChunks: 5, relevantChunks: 4, faithfulness: 0.94, answerRelevance: 0.97, hora: "Hace 3 min" },
  { id: "rt2", query: "Como configuro el SSO con Azure AD?", retrievedChunks: 8, relevantChunks: 3, faithfulness: 0.61, answerRelevance: 0.78, hora: "Hace 11 min" },
  { id: "rt3", query: "Que modelos de LLM estan disponibles en el plan starter?", retrievedChunks: 3, relevantChunks: 3, faithfulness: 0.99, answerRelevance: 0.95, hora: "Hace 22 min" },
  { id: "rt4", query: "Puedo exportar los logs de mi agente en formato CSV?", retrievedChunks: 4, relevantChunks: 1, faithfulness: 0.44, answerRelevance: 0.62, hora: "Hace 35 min" },
  { id: "rt5", query: "Cual es el limite de tokens por llamada en GPT-4o?", retrievedChunks: 6, relevantChunks: 5, faithfulness: 0.88, answerRelevance: 0.91, hora: "Hace 1 hora" },
]

// ─── Sub-components: Human Eval Tab ──────────────────────────────────────────

function HumanEvalTab() {
  const [items, setItems] = useState<HumanEvalItem[]>(HUMAN_QUEUE)
  const [activeItem, setActiveItem] = useState<HumanEvalItem | null>(items.find(i => i.status === "pending") ?? null)
  const [comment, setComment] = useState("")

  const pending = items.filter(i => i.status === "pending")
  const done    = items.filter(i => i.status === "done")

  const submitVerdict = (verdict: "positive" | "negative") => {
    if (!activeItem) return
    setItems(prev => prev.map(i =>
      i.id === activeItem.id ? { ...i, status: "done", verdict, comment: comment || undefined } : i
    ))
    setComment("")
    const nextPending = items.filter(i => i.status === "pending" && i.id !== activeItem.id)
    setActiveItem(nextPending[0] ?? null)
  }

  return (
    <div className="flex gap-5 h-full" style={{ minHeight: 0 }}>
      {/* Left: queue */}
      <div
        className="w-72 shrink-0 flex flex-col rounded-2xl border overflow-hidden"
        style={{ background: "#FFFFFF", borderColor: "rgba(145,158,171,0.16)" }}
      >
        <div className="px-4 py-3 border-b flex items-center justify-between shrink-0" style={{ borderColor: "rgba(145,158,171,0.12)" }}>
          <p className="text-sm font-semibold" style={{ color: "#1C2434" }}>Cola de revision</p>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: "rgba(212,0,154,0.1)", color: "#D4009A" }}
          >
            {pending.length} pendientes
          </span>
        </div>
        <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: "rgba(145,158,171,0.08)" }}>
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveItem(item)}
              className="w-full text-left px-4 py-3 transition-colors"
              style={{
                background: activeItem?.id === item.id ? "#FFF0FA" : "transparent",
                borderLeft: activeItem?.id === item.id ? "3px solid #D4009A" : "3px solid transparent",
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: "#1C2434" }}>{item.conversationId}</p>
                  <p className="text-[11px] mt-0.5 truncate" style={{ color: "#637381" }}>{item.agentName}</p>
                  <p className="text-[11px] mt-1 leading-relaxed" style={{ color: "#9AA3B0", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {item.userQuery}
                  </p>
                </div>
                <div className="shrink-0 mt-0.5">
                  {item.status === "done" ? (
                    item.verdict === "positive"
                      ? <ThumbsUp className="h-3.5 w-3.5" style={{ color: "#16A34A" }} />
                      : <ThumbsDown className="h-3.5 w-3.5" style={{ color: "#DC2626" }} />
                  ) : (
                    <div className="h-2 w-2 rounded-full mt-1" style={{ background: "#D4009A" }} />
                  )}
                </div>
              </div>
              <p className="text-[10px] mt-1.5" style={{ color: "#9AA3B0" }}>{item.hora}</p>
            </button>
          ))}
        </div>
        <div className="px-4 py-2.5 border-t shrink-0" style={{ borderColor: "rgba(145,158,171,0.12)" }}>
          <p className="text-[11px]" style={{ color: "#9AA3B0" }}>{done.length} evaluadas hoy</p>
        </div>
      </div>

      {/* Right: annotation panel */}
      {activeItem ? (
        <div
          className="flex-1 flex flex-col gap-4 rounded-2xl border p-6 overflow-y-auto"
          style={{ background: "#FFFFFF", borderColor: "rgba(145,158,171,0.16)" }}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold" style={{ color: "#1C2434" }}>{activeItem.conversationId}</p>
                <span className="text-[11px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(145,158,171,0.1)", color: "#637381" }}>{activeItem.agentName}</span>
                {activeItem.status === "done" && (
                  <span className="text-[11px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "rgba(22,163,74,0.1)", color: "#16A34A" }}>Evaluada</span>
                )}
              </div>
              <p className="text-[11px] mt-0.5" style={{ color: "#9AA3B0" }}>{activeItem.hora}</p>
            </div>
          </div>

          {/* Conversation */}
          <div className="flex flex-col gap-3">
            {/* User query */}
            <div className="flex items-start gap-3">
              <div
                className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-bold"
                style={{ background: "#F0F2F5", color: "#637381" }}
              >
                U
              </div>
              <div
                className="flex-1 rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed"
                style={{ background: "#F4F6F8", color: "#1C2434" }}
              >
                {activeItem.userQuery}
              </div>
            </div>
            {/* Agent response */}
            <div className="flex items-start gap-3 flex-row-reverse">
              <div
                className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, #D4009A, #0F2870)" }}
              >
                <Zap className="h-3.5 w-3.5 text-white" />
              </div>
              <div
                className="flex-1 rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed"
                style={{ background: "#EEF1FF", color: "#1C2434" }}
              >
                {activeItem.agentResponse}
              </div>
            </div>
          </div>

          {/* Verdict (if done) */}
          {activeItem.status === "done" ? (
            <div
              className="rounded-xl p-4 flex items-start gap-3"
              style={{ background: activeItem.verdict === "positive" ? "rgba(22,163,74,0.06)" : "rgba(220,38,38,0.06)", border: `1px solid ${activeItem.verdict === "positive" ? "rgba(22,163,74,0.2)" : "rgba(220,38,38,0.2)"}` }}
            >
              {activeItem.verdict === "positive"
                ? <ThumbsUp className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#16A34A" }} />
                : <ThumbsDown className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#DC2626" }} />
              }
              <div>
                <p className="text-sm font-semibold" style={{ color: activeItem.verdict === "positive" ? "#16A34A" : "#DC2626" }}>
                  {activeItem.verdict === "positive" ? "Respuesta aprobada" : "Respuesta rechazada"}
                </p>
                {activeItem.comment && (
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: "#637381" }}>{activeItem.comment}</p>
                )}
              </div>
            </div>
          ) : (
            /* Annotation controls */
            <div className="flex flex-col gap-3 mt-2">
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: "#637381" }}>
                  Comentario (opcional)
                </label>
                <div className="flex gap-2">
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Explica por que la respuesta es buena o mala, que falta, que sobra..."
                    rows={3}
                    className="flex-1 text-sm px-3 py-2.5 rounded-xl border outline-none resize-none leading-relaxed"
                    style={{ borderColor: "rgba(145,158,171,0.24)", color: "#1C2434", background: "#FFFFFF" }}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => submitVerdict("positive")}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors border"
                  style={{ background: "rgba(22,163,74,0.06)", borderColor: "rgba(22,163,74,0.3)", color: "#16A34A" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(22,163,74,0.12)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(22,163,74,0.06)"}
                >
                  <ThumbsUp className="h-4 w-4" />
                  Respuesta correcta
                </button>
                <button
                  onClick={() => submitVerdict("negative")}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors border"
                  style={{ background: "rgba(220,38,38,0.06)", borderColor: "rgba(220,38,38,0.3)", color: "#DC2626" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(220,38,38,0.12)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(220,38,38,0.06)"}
                >
                  <ThumbsDown className="h-4 w-4" />
                  Respuesta incorrecta
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center rounded-2xl border" style={{ borderColor: "rgba(145,158,171,0.16)", background: "#FFFFFF" }}>
          <div className="text-center">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-3" style={{ color: "#16A34A" }} />
            <p className="text-sm font-semibold" style={{ color: "#1C2434" }}>Cola al dia</p>
            <p className="text-xs mt-1" style={{ color: "#637381" }}>No hay conversaciones pendientes de revision.</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sub-components: LLM Judge Tab ───────────────────────────────────────────

function LlmJudgeTab() {
  const [configs, setConfigs] = useState<JudgeConfig[]>(JUDGE_CONFIGS)
  const [activeConfig, setActiveConfig] = useState<JudgeConfig>(JUDGE_CONFIGS[0])
  const [editedPrompt, setEditedPrompt] = useState(JUDGE_CONFIGS[0].prompt)
  const [running, setRunning] = useState(false)
  const [lastResult, setLastResult] = useState<{ score: number; reasoning: string } | null>(null)

  const handleSelectConfig = (cfg: JudgeConfig) => {
    setActiveConfig(cfg)
    setEditedPrompt(cfg.prompt)
    setLastResult(null)
  }

  const handleSavePrompt = () => {
    setConfigs(prev => prev.map(c => c.id === activeConfig.id ? { ...c, prompt: editedPrompt } : c))
    setActiveConfig(prev => ({ ...prev, prompt: editedPrompt }))
  }

  const handleRunJudge = () => {
    setRunning(true)
    setLastResult(null)
    setTimeout(() => {
      const score = parseFloat((Math.random() * 0.3 + 0.65).toFixed(2))
      setLastResult({
        score,
        reasoning: score >= 0.8
          ? "La respuesta aborda completamente la consulta del usuario con informacion precisa y bien estructurada. El tono es profesional y empatico. No se detectaron inexactitudes."
          : "La respuesta es parcialmente correcta pero omite detalles importantes sobre el proceso de configuracion. Podria mejorarse agregando los pasos especificos y un enlace a la documentacion relevante.",
      })
      setRunning(false)
    }, 2000)
  }

  const sc = (s: number) => s >= 0.8 ? "#16A34A" : s >= 0.5 ? "#D97706" : "#DC2626"
  const sb = (s: number) => s >= 0.8 ? "rgba(22,163,74,0.1)" : s >= 0.5 ? "rgba(217,119,6,0.1)" : "rgba(220,38,38,0.1)"

  return (
    <div className="flex gap-5 h-full" style={{ minHeight: 0 }}>
      {/* Left: evaluador list */}
      <div
        className="w-72 shrink-0 flex flex-col rounded-2xl border overflow-hidden"
        style={{ background: "#FFFFFF", borderColor: "rgba(145,158,171,0.16)" }}
      >
        <div className="px-4 py-3 border-b shrink-0" style={{ borderColor: "rgba(145,158,171,0.12)" }}>
          <p className="text-sm font-semibold" style={{ color: "#1C2434" }}>Evaluadores LLM</p>
          <p className="text-[11px] mt-0.5" style={{ color: "#637381" }}>Selecciona uno para editar su prompt</p>
        </div>
        <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: "rgba(145,158,171,0.08)" }}>
          {configs.map(cfg => (
            <button
              key={cfg.id}
              onClick={() => handleSelectConfig(cfg)}
              className="w-full text-left px-4 py-3.5 transition-colors"
              style={{
                background: activeConfig.id === cfg.id ? "#FFF0FA" : "transparent",
                borderLeft: activeConfig.id === cfg.id ? "3px solid #D4009A" : "3px solid transparent",
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: "#1C2434" }}>{cfg.name}</p>
                  <p className="text-[11px] mt-0.5 truncate" style={{ color: "#637381" }}>{cfg.targetSubAgent}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: sb(cfg.lastRunScore), color: sc(cfg.lastRunScore) }}
                    >
                      {cfg.lastRunScore.toFixed(2)}
                    </span>
                    <span className="text-[10px]" style={{ color: "#9AA3B0" }}>{cfg.runsToday} hoy</span>
                  </div>
                </div>
                <div className="h-2.5 w-2.5 rounded-full mt-1 shrink-0" style={{ background: cfg.accentColor }} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: prompt editor */}
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto" style={{ minHeight: 0 }}>
        {/* Header */}
        <div
          className="rounded-2xl border p-5"
          style={{ background: "#FFFFFF", borderColor: "rgba(145,158,171,0.16)" }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="h-3 w-3 rounded-full" style={{ background: activeConfig.accentColor }} />
                <p className="text-sm font-bold" style={{ color: "#1C2434" }}>{activeConfig.name}</p>
              </div>
              <p className="text-xs" style={{ color: "#637381" }}>
                Modelo: <span className="font-medium" style={{ color: "#1C2434" }}>{activeConfig.model}</span>
                {" · "}Target: <span className="font-medium" style={{ color: "#1C2434" }}>{activeConfig.targetSubAgent}</span>
                {" · "}Score actual: <span className="font-bold" style={{ color: sc(activeConfig.lastRunScore) }}>{activeConfig.lastRunScore.toFixed(2)}</span>
                {" · "}{activeConfig.runsToday} ejecuciones hoy
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={handleSavePrompt}
                className="text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors"
                style={{ borderColor: "rgba(145,158,171,0.24)", color: "#637381", background: "#FFFFFF" }}
                onMouseEnter={e => e.currentTarget.style.background = "#F4F6F8"}
                onMouseLeave={e => e.currentTarget.style.background = "#FFFFFF"}
              >
                Guardar prompt
              </button>
              <button
                onClick={handleRunJudge}
                disabled={running}
                className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white transition-all flex items-center gap-1.5"
                style={{ background: running ? "#9AA3B0" : "#D4009A" }}
              >
                {running ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                {running ? "Evaluando..." : "Probar en muestra"}
              </button>
            </div>
          </div>
        </div>

        {/* Prompt editor */}
        <div
          className="rounded-2xl border flex flex-col"
          style={{ background: "#FFFFFF", borderColor: "rgba(145,158,171,0.16)" }}
        >
          <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: "rgba(145,158,171,0.12)" }}>
            <MessageSquare className="h-3.5 w-3.5" style={{ color: "#637381" }} />
            <p className="text-xs font-semibold" style={{ color: "#1C2434" }}>Prompt del juez</p>
            <div
              className="flex items-center gap-1 ml-2 px-2 py-0.5 rounded-md text-[10px]"
              style={{ background: "rgba(94,36,213,0.08)", color: "#5E24D5" }}
            >
              <Info className="h-2.5 w-2.5" />
              El prompt recibe la traza como contexto
            </div>
          </div>
          <textarea
            value={editedPrompt}
            onChange={e => setEditedPrompt(e.target.value)}
            className="flex-1 px-5 py-4 text-sm leading-relaxed font-mono outline-none resize-none"
            style={{ color: "#1C2434", background: "transparent", minHeight: "220px" }}
          />
        </div>

        {/* Last result */}
        {lastResult && (
          <div
            className="rounded-2xl border p-5 flex flex-col gap-3"
            style={{
              background: "#FFFFFF",
              borderColor: "rgba(145,158,171,0.16)",
              borderLeft: `4px solid ${sc(lastResult.score)}`,
            }}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold" style={{ color: "#1C2434" }}>Resultado de la prueba</p>
              <span
                className="text-sm font-bold px-3 py-1 rounded-full"
                style={{ background: sb(lastResult.score), color: sc(lastResult.score) }}
              >
                {lastResult.score.toFixed(2)}
              </span>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#9AA3B0" }}>Razonamiento del juez</p>
              <p className="text-sm leading-relaxed" style={{ color: "#454F5B" }}>{lastResult.reasoning}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Sub-components: RAG Reliability Tab ─────────────────────────────────────

function RagReliabilityTab() {
  const [selectedTrace, setSelectedTrace] = useState<RagTrace | null>(null)

  const sc = (s: number) => s >= 0.8 ? "#16A34A" : s >= 0.5 ? "#D97706" : "#DC2626"
  const sb = (s: number) => s >= 0.8 ? "rgba(22,163,74,0.08)" : s >= 0.5 ? "rgba(217,119,6,0.08)" : "rgba(220,38,38,0.08)"

  const overallScore = RAG_METRICS.reduce((a, m) => a + m.score, 0) / RAG_METRICS.length

  return (
    <div className="flex flex-col gap-5">

      {/* Overall banner */}
      <div
        className="rounded-2xl border p-5 flex items-center gap-6"
        style={{
          background: "#FFFFFF",
          borderColor: "rgba(145,158,171,0.16)",
          borderLeft: `4px solid ${sc(overallScore)}`,
        }}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "#9AA3B0" }}>Score RAG global</p>
          <p className="text-4xl font-bold" style={{ color: sc(overallScore) }}>{overallScore.toFixed(2)}</p>
          <p className="text-xs mt-1" style={{ color: "#637381" }}>Promedio de las 4 metricas RAGAS · Ag. Conocimiento</p>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-3">
          {RAG_METRICS.map(m => (
            <div key={m.id} className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium" style={{ color: "#637381" }}>{m.name}</span>
                  <span className="text-xs font-bold" style={{ color: sc(m.score) }}>{m.score.toFixed(2)}</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: "#F1F5F9" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${m.score * 100}%`, background: sc(m.score) }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Metric detail cards */}
      <div className="grid grid-cols-4 gap-4">
        {RAG_METRICS.map(m => (
          <div
            key={m.id}
            className="rounded-2xl border p-5 flex flex-col gap-3"
            style={{
              background: "#FFFFFF",
              borderColor: "rgba(145,158,171,0.16)",
              borderTop: `3px solid ${m.accentColor}`,
            }}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold" style={{ color: "#1C2434" }}>{m.name}</p>
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                style={{
                  background: m.trend === "up" ? "rgba(22,163,74,0.1)" : m.trend === "down" ? "rgba(220,38,38,0.1)" : "rgba(145,158,171,0.1)",
                  color: m.trend === "up" ? "#16A34A" : m.trend === "down" ? "#DC2626" : "#637381",
                }}
              >
                {m.trendValue}
              </span>
            </div>
            <p className="text-3xl font-bold" style={{ color: sc(m.score) }}>{m.score.toFixed(2)}</p>
            <p className="text-[11px] leading-relaxed" style={{ color: "#637381" }}>{m.description}</p>
          </div>
        ))}
      </div>

      {/* Trace table */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ background: "#FFFFFF", borderColor: "rgba(145,158,171,0.16)" }}
      >
        <div
          className="px-5 py-4 border-b"
          style={{ borderColor: "rgba(145,158,171,0.12)" }}
        >
          <p className="text-sm font-semibold" style={{ color: "#1C2434" }}>Trazas RAG recientes</p>
          <p className="text-xs mt-0.5" style={{ color: "#637381" }}>Cada fila es una consulta al sub-agente de Conocimiento</p>
        </div>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ background: "#F7F8FA" }}>
              <th className="text-left px-5 py-2.5 text-xs font-semibold" style={{ color: "#637381" }}>Consulta</th>
              <th className="text-center px-4 py-2.5 text-xs font-semibold" style={{ color: "#637381" }}>Chunks recuperados</th>
              <th className="text-center px-4 py-2.5 text-xs font-semibold" style={{ color: "#637381" }}>Chunks relevantes</th>
              <th className="text-center px-4 py-2.5 text-xs font-semibold" style={{ color: "#637381" }}>Faithfulness</th>
              <th className="text-center px-4 py-2.5 text-xs font-semibold" style={{ color: "#637381" }}>Answer Relevance</th>
              <th className="text-right px-5 py-2.5 text-xs font-semibold" style={{ color: "#637381" }}>Hora</th>
            </tr>
          </thead>
          <tbody>
            {RAG_TRACES.map(trace => {
              const precision = trace.relevantChunks / trace.retrievedChunks
              const isSelected = selectedTrace?.id === trace.id
              return (
                <tr
                  key={trace.id}
                  onClick={() => setSelectedTrace(isSelected ? null : trace)}
                  className="cursor-pointer border-t transition-colors"
                  style={{
                    borderColor: "rgba(145,158,171,0.1)",
                    background: isSelected ? "#FFF0FA" : undefined,
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#F7F8FA" }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "" }}
                >
                  <td className="px-5 py-3 max-w-xs">
                    <p className="text-xs" style={{ color: "#1C2434", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {trace.query}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs font-semibold" style={{ color: "#1C2434" }}>{trace.retrievedChunks}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: sb(precision), color: sc(precision) }}
                    >
                      {trace.relevantChunks} <span className="font-normal" style={{ color: "#9AA3B0" }}>/ {trace.retrievedChunks}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: sb(trace.faithfulness), color: sc(trace.faithfulness) }}
                    >
                      {trace.faithfulness.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: sb(trace.answerRelevance), color: sc(trace.answerRelevance) }}
                    >
                      {trace.answerRelevance.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <p className="text-xs" style={{ color: "#9AA3B0" }}>{trace.hora}</p>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Main view ────────────────────────────────────────────────────────────────

export function EvaluacionesView() {
  const [activeTab, setActiveTab] = useState<EvalTab>("metricas")
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
          className="flex flex-col border-b shrink-0"
          style={{ background: "#FFFFFF", borderColor: "rgba(145,158,171,0.16)" }}
        >
          <div className="flex items-center justify-between px-6 pt-4 pb-3 gap-4 flex-wrap">
            <div>
              <h1 className="text-lg font-bold" style={{ color: "#1C2434" }}>Evaluaciones</h1>
              <p className="text-sm mt-0.5" style={{ color: "#637381" }}>
                Calidad de tus agentes CORE en produccion — respuesta final y cada sub-agente del grafo
              </p>
            </div>
            {/* Agent selector — only visible on metrics tab */}
            {activeTab === "metricas" && (
              <div className="relative">
                <select
                  value={agentFilter}
                  onChange={(e) => setAgentFilter(e.target.value)}
                  className="appearance-none text-sm pl-3 pr-8 py-2 rounded-xl border outline-none"
                  style={{ background: "#FFFFFF", borderColor: "rgba(145,158,171,0.24)", color: "#1C2434" }}
                >
                  <option value="todos">Todos mis agentes CORE</option>
                  {AGENTS.map((a) => (
                    <option key={a.id} value={a.name}>{a.name}</option>
                  ))}
                </select>
                <ChevronDown className="h-3.5 w-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#637381" }} />
              </div>
            )}
          </div>

          {/* Tab bar */}
          <div className="flex items-center gap-0 px-6">
            {TABS.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all"
                  style={{
                    borderBottomColor: isActive ? "#D4009A" : "transparent",
                    color: isActive ? "#D4009A" : "#637381",
                    background: "transparent",
                  }}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">

          {/* ── Human eval tab ─────────────────────────────────────────────── */}
          {activeTab === "humana" && <HumanEvalTab />}

          {/* ── LLM Judge tab ──────────────────────────────────────────────── */}
          {activeTab === "llm-judge" && <LlmJudgeTab />}

          {/* ── RAG Reliability tab ────────────────────────────────────────── */}
          {activeTab === "rag" && <RagReliabilityTab />}

          {/* ── Metrics tab ────────────────────────────────────────────────── */}
          {activeTab === "metricas" && <>

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
              <p className="text-sm font-semibold" style={{ color: "#1C2434" }}>Evaluadores activos</p>
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

          </>}

        </div>
      </div>

      {/* ── Trace detail panel ─────────────────────────────────────────────── */}
      {selectedRow && (
        <TraceDetailPanel row={selectedRow} onClose={() => setSelectedRow(null)} />
      )}
    </div>
  )
}
