"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  RotateCcw,
  Send,
  ChevronDown,
  Shield,
  Brain,
  Cpu,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Wrench,
  Mail,
  Database,
  GitBranch,
  Loader2,
  AlertTriangle,
  MessageSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

// ─── Types ────────────────────────────────────────────────────────────────────

type ConvStatus = "active" | "pending-approval" | "done"

interface Conversation {
  id: string
  title: string
  agentName: string
  agentInitials: string
  agentColor: string
  timestamp: string
  status: ConvStatus
  messages: ChatMessage[]
}

type StreamStepKind =
  | "guardrail-checking"
  | "guardrail-ok"
  | "guardrail-blocked"
  | "supervisor-analyzing"
  | "supervisor-assigned"
  | "agent-thinking"
  | "tool-approval"
  | "tool-executed"
  | "tool-rejected"
  | "response"

interface StreamStep {
  id: string
  kind: StreamStepKind
  text: string
  subText?: string
  toolData?: ToolApprovalData
  responseText?: string
}

interface ToolApprovalData {
  toolName: string
  integration: string
  icon: "mail" | "database" | "github" | "webhook"
  params: Record<string, string>
}

interface ChatMessage {
  id: string
  role: "user" | "stream"
  text?: string
  steps?: StreamStep[]
}

// ─── Mock Agents ──────────────────────────────────────────────────────────────

const AGENTS = [
  { id: "ag-001", name: "RRHH - Políticas", initials: "RR", color: "#D4009A", description: "Responde consultas de RRHH" },
  { id: "ag-002", name: "Soporte Técnico",  initials: "ST", color: "#0F2870", description: "Resuelve incidencias técnicas" },
  { id: "ag-003", name: "Agente Comercial", initials: "AC", color: "#059669", description: "Gestiona oportunidades de venta" },
]

// ─── Mock Conversations ───────────────────────────────────────────────────────

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: "c1",
    title: "Consulta sobre políticas de vacaciones",
    agentName: "RRHH - Políticas",
    agentInitials: "RR",
    agentColor: "#D4009A",
    timestamp: "Hace 5 min",
    status: "done",
    messages: [
      {
        id: "c1-u1",
        role: "user",
        text: "¿Cuáles son las políticas de vacaciones?",
      },
      {
        id: "c1-s1",
        role: "stream",
        steps: [
          {
            id: "c1-step1",
            kind: "guardrail-ok",
            text: "Guardrail: Prompt validado sin contenido inapropiado",
          },
          {
            id: "c1-step2",
            kind: "supervisor-assigned",
            text: "Supervisor: Tarea asignada a:",
            subText: "Ag. Conocimiento (RRHH)",
          },
          {
            id: "c1-step3",
            kind: "agent-thinking",
            text: "Buscando en documentación de RRHH...",
          },
          {
            id: "c1-step4",
            kind: "response",
            text: "",
            responseText:
              "Según la documentación de RRHH, las políticas de vacaciones establecen que:\n\n1. Cada empleado tiene derecho a 15 días hábiles de vacaciones al año\n2. Las vacaciones deben solicitarse con al menos 2 semanas de anticipación\n3. Se pueden fraccionar en períodos mínimos de 5 días",
          },
        ],
      },
      {
        id: "c1-u2",
        role: "user",
        text: "¿Y los días administrativos?",
      },
      {
        id: "c1-s2",
        role: "stream",
        steps: [
          {
            id: "c1-step5",
            kind: "guardrail-ok",
            text: "Guardrail: OK",
          },
          {
            id: "c1-step6",
            kind: "agent-thinking",
            text: "Consultando política de días administrativos...",
          },
          {
            id: "c1-step7",
            kind: "response",
            text: "",
            responseText:
              "Los días administrativos son:\n\n- 3 días al año por asuntos personales\n- Deben justificarse y solicitarse con anticipación\n- No son acumulables al año siguiente",
          },
        ],
      },
    ],
  },
  {
    id: "c2",
    title: "Crear repositorio para proyecto nuevo",
    agentName: "Soporte Técnico",
    agentInitials: "ST",
    agentColor: "#0F2870",
    timestamp: "Hace 32 min",
    status: "pending-approval",
    messages: [
      {
        id: "c2-u1",
        role: "user",
        text: "Necesito que crees un repositorio en GitHub para el proyecto nuevo",
      },
      {
        id: "c2-s1",
        role: "stream",
        steps: [
          {
            id: "c2-step1",
            kind: "guardrail-ok",
            text: "Guardrail: Validando integridad del prompt... OK",
          },
          {
            id: "c2-step2",
            kind: "supervisor-assigned",
            text: "Supervisor: Tarea asignada a:",
            subText: "Ag. Herramientas",
          },
          {
            id: "c2-step3",
            kind: "agent-thinking",
            text: "Ag. Herramientas está procesando la solicitud...",
          },
          {
            id: "c2-step4",
            kind: "tool-approval",
            text: "Acción requiere aprobación",
            toolData: {
              toolName: "Crear Repositorio",
              integration: "GitHub",
              icon: "github",
              params: {
                "Repo Name": "new-project",
                Visibility: "private",
                Template: "node-typescript",
              },
            },
          },
        ],
      },
    ],
  },
  {
    id: "c3",
    title: "Análisis de oportunidad comercial Q4",
    agentName: "Agente Comercial",
    agentInitials: "AC",
    agentColor: "#059669",
    timestamp: "Ayer",
    status: "done",
    messages: [
      {
        id: "c3-u1",
        role: "user",
        text: "Dame un análisis de las oportunidades comerciales para Q4",
      },
      {
        id: "c3-s1",
        role: "stream",
        steps: [
          {
            id: "c3-step1",
            kind: "guardrail-ok",
            text: "Guardrail: OK",
          },
          {
            id: "c3-step2",
            kind: "supervisor-assigned",
            text: "Supervisor: Tarea asignada a:",
            subText: "Ag. Conocimiento + Ag. Herramientas",
          },
          {
            id: "c3-step3",
            kind: "agent-thinking",
            text: "Consultando CRM y datos históricos de ventas...",
          },
          {
            id: "c3-step4",
            kind: "tool-executed",
            text: "Buscar en CRM ejecutada correctamente",
            toolData: {
              toolName: "Buscar en CRM",
              integration: "Salesforce",
              icon: "database",
              params: { Período: "Q4 2024", Filtro: "oportunidades abiertas" },
            },
          },
          {
            id: "c3-step5",
            kind: "response",
            text: "",
            responseText:
              "Análisis de oportunidades Q4:\n\n**Pipeline actual:** $2.4M en oportunidades activas\n\n- **Alta probabilidad (>70%):** 3 deals por $890K\n- **Media probabilidad (40-70%):** 7 deals por $1.1M\n- **Baja probabilidad (<40%):** 5 deals por $410K\n\n> Recomendación: enfocar esfuerzos en los 3 deals de alta probabilidad para cerrar antes de diciembre.",
          },
        ],
      },
    ],
  },
]

// ─── Build random stream sequence for new messages ────────────────────────────

function buildStreamSequence(text: string): StreamStep[] {
  const needsTool =
    /crea|envia|busca|registra|genera|actualiza/i.test(text)

  const id = () => crypto.randomUUID()

  const steps: StreamStep[] = [
    {
      id: id(),
      kind: "guardrail-checking",
      text: "Guardrail: Analizando el prompt...",
    },
    {
      id: id(),
      kind: "guardrail-ok",
      text: "Guardrail: Sin contenido inapropiado detectado",
    },
    {
      id: id(),
      kind: "supervisor-analyzing",
      text: "Supervisor: Evaluando la solicitud...",
    },
    {
      id: id(),
      kind: "supervisor-assigned",
      text: "Supervisor: Tarea asignada a:",
      subText: needsTool ? "Ag. Herramientas" : "Ag. Conocimiento",
    },
    {
      id: id(),
      kind: "agent-thinking",
      text: needsTool
        ? "Ag. Herramientas está preparando la acción..."
        : "Buscando información relevante...",
    },
  ]

  if (needsTool) {
    steps.push({
      id: id(),
      kind: "tool-approval",
      text: "Acción requiere aprobación humana",
      toolData: {
        toolName: "Enviar Email",
        integration: "Gmail",
        icon: "mail",
        params: {
          Para: "equipo@empresa.com",
          Asunto: text.slice(0, 40),
          Cuerpo: "Mensaje generado por el agente KRNL.",
        },
      },
    })
  } else {
    steps.push({
      id: id(),
      kind: "response",
      text: "",
      responseText: `He procesado tu consulta: **"${text}"**\n\nBasándome en la información disponible, aquí está mi respuesta detallada. Puedo profundizar en cualquier punto si lo necesitas.`,
    })
  }

  return steps
}

// ─── StreamStepRow component ──────────────────────────────────────────────────

function StreamStepRow({
  step,
  visible,
  onApprove,
  onReject,
}: {
  step: StreamStep
  visible: boolean
  onApprove: (stepId: string) => void
  onReject: (stepId: string) => void
}) {
  if (!visible) return null

  const toolIconMap: Record<string, React.ReactNode> = {
    mail:     <Mail     className="h-4 w-4" />,
    database: <Database className="h-4 w-4" />,
    github:   <GitBranch className="h-4 w-4" />,
    webhook:  <Wrench   className="h-4 w-4" />,
  }

  // ── Tool approval block ──────────────────────────────────────────────────
  if (step.kind === "tool-approval") {
    const td = step.toolData!
    return (
      <div
        className="rounded-xl border-2 p-4 space-y-3 w-full"
        style={{ borderColor: "#F59E0B", background: "#FFFBEB" }}
      >
        {/* Header */}
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: "#D97706" }} />
          <span className="text-sm font-semibold" style={{ color: "#92400E" }}>
            Aprobación requerida
          </span>
        </div>

        {/* Tool info */}
        <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.8)" }}>
          <div
            className="h-9 w-9 rounded-lg flex items-center justify-center text-white shrink-0"
            style={{ background: "#0F2870" }}
          >
            {toolIconMap[td.icon] ?? <Wrench className="h-4 w-4" />}
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#1C2434" }}>{td.toolName}</p>
            <p className="text-xs" style={{ color: "#637381" }}>via {td.integration}</p>
          </div>
        </div>

        {/* Params */}
        <div className="rounded-lg overflow-hidden border" style={{ borderColor: "rgba(217,119,6,0.2)" }}>
          <table className="w-full text-xs">
            <tbody>
              {Object.entries(td.params).map(([key, val], i) => (
                <tr key={key} style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.6)" : "rgba(255,251,235,0.6)" }}>
                  <td className="px-3 py-1.5 font-mono font-medium" style={{ color: "#92400E", width: "35%" }}>{key}</td>
                  <td className="px-3 py-1.5 font-mono" style={{ color: "#1C2434" }}>{val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onReject(step.id)}
            className="flex-1 py-2 rounded-lg text-sm font-medium border transition-colors"
            style={{ borderColor: "#E5E7EB", color: "#374151", background: "#FFFFFF" }}
          >
            Rechazar
          </button>
          <button
            onClick={() => onApprove(step.id)}
            className="flex-1 py-2 rounded-lg text-sm font-medium text-white transition-colors"
            style={{ background: "#D4009A" }}
          >
            Aprobar y ejecutar
          </button>
        </div>
      </div>
    )
  }

  // ── Tool executed ────────────────────────────────────────────────────────
  if (step.kind === "tool-executed") {
    return (
      <div className="flex items-center gap-2 py-1">
        <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "#059669" }} />
        <span className="text-xs" style={{ color: "#059669" }}>{step.text}</span>
      </div>
    )
  }

  // ── Tool rejected ────────────────────────────────────────────────────────
  if (step.kind === "tool-rejected") {
    return (
      <div className="flex items-center gap-2 py-1">
        <XCircle className="h-4 w-4 shrink-0" style={{ color: "#DC2626" }} />
        <span className="text-xs" style={{ color: "#DC2626" }}>{step.text}</span>
      </div>
    )
  }

  // ── Guardrail blocked ────────────────────────────────────────────────────
  if (step.kind === "guardrail-blocked") {
    return (
      <div className="flex items-center gap-2 py-1">
        <Shield className="h-4 w-4 shrink-0" style={{ color: "#DC2626" }} />
        <span className="text-xs font-medium" style={{ color: "#DC2626" }}>{step.text}</span>
      </div>
    )
  }

  // ── Icon map for log rows ────────────────────────────────────────────────
  const iconMap: Partial<Record<StreamStepKind, React.ReactNode>> = {
    "guardrail-checking":   <Loader2    className="h-3.5 w-3.5 animate-spin" style={{ color: "#637381" }} />,
    "guardrail-ok":         <Shield     className="h-3.5 w-3.5" style={{ color: "#059669" }} />,
    "supervisor-analyzing": <Loader2    className="h-3.5 w-3.5 animate-spin" style={{ color: "#637381" }} />,
    "supervisor-assigned":  <Brain      className="h-3.5 w-3.5" style={{ color: "#5E24D5" }} />,
  }

  const icon = iconMap[step.kind]
  if (!icon) return null

  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="shrink-0">{icon}</span>
      <span className="text-xs" style={{ color: "#637381" }}>
        {step.text}
        {step.subText && (
          <span className="font-semibold ml-1" style={{ color: "#1C2434" }}>{step.subText}</span>
        )}
      </span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PlaygroundView() {
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS)
  const [activeConvId, setActiveConvId] = useState<string>("c1")
  const [selectedAgentId, setSelectedAgentId] = useState<string>("ag-001")
  const [agentDropdownOpen, setAgentDropdownOpen] = useState(false)
  const [envDropdownOpen, setEnvDropdownOpen] = useState(false)
  const [inputText, setInputText] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [visibleSteps, setVisibleSteps] = useState<Set<string>>(() => {
    // All steps from initial conversations are pre-revealed
    const ids = new Set<string>()
    INITIAL_CONVERSATIONS.forEach((c) =>
      c.messages.forEach((m) =>
        m.steps?.forEach((s) => ids.add(s.id))
      )
    )
    return ids
  })
  const [pendingStreamMsgId, setPendingStreamMsgId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const activeConv = conversations.find((c) => c.id === activeConvId)
  const selectedAgent = AGENTS.find((a) => a.id === selectedAgentId)!

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [activeConv?.messages, visibleSteps])

  // ── Reveal steps sequentially ──────────────────────────────────────────────
  const revealSteps = useCallback((steps: StreamStep[], msgId: string) => {
    let i = 0
    const next = () => {
      if (i >= steps.length) {
        setIsStreaming(false)
        setPendingStreamMsgId(null)
        return
      }
      const step = steps[i]
      if (step.kind === "tool-approval") {
        setVisibleSteps((prev) => new Set([...prev, step.id]))
        setIsStreaming(false)
        return
      }
      const delay =
        step.kind === "guardrail-checking" || step.kind === "supervisor-analyzing"
          ? 700
          : step.kind === "agent-thinking"
          ? 1200
          : 400
      setTimeout(() => {
        setVisibleSteps((prev) => new Set([...prev, step.id]))
        i++
        next()
      }, delay)
    }
    next()
  }, [])

  // ── Handle approve ─────────────────────────────────────────────────────────
  const handleApprove = useCallback(
    (stepId: string, msgId: string) => {
      const responseStepId = crypto.randomUUID()
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id !== activeConvId) return conv
          return {
            ...conv,
            messages: conv.messages.map((msg) => {
              if (msg.id !== msgId || !msg.steps) return msg
              const updatedSteps = msg.steps.map((s) =>
                s.id === stepId
                  ? { ...s, kind: "tool-executed" as StreamStepKind, text: `${s.toolData?.toolName ?? "Herramienta"} ejecutada correctamente` }
                  : s
              )
              const hasResponse = updatedSteps.some((s) => s.kind === "response")
              if (!hasResponse) {
                updatedSteps.push({
                  id: responseStepId,
                  kind: "response",
                  text: "",
                  responseText: "La acción fue ejecutada exitosamente. El resultado ha sido procesado y registrado en el sistema.",
                })
              }
              return { ...msg, steps: updatedSteps }
            }),
          }
        })
      )
      setVisibleSteps((prev) => new Set([...prev, stepId]))
      setTimeout(() => {
        setVisibleSteps((prev) => new Set([...prev, responseStepId]))
        setIsStreaming(false)
      }, 500)
    },
    [activeConvId]
  )

  // ── Handle reject ──────────────────────────────────────────────────────────
  const handleReject = useCallback(
    (stepId: string, _msgId: string) => {
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id !== activeConvId) return conv
          return {
            ...conv,
            messages: conv.messages.map((msg) => {
              if (!msg.steps) return msg
              return {
                ...msg,
                steps: msg.steps.map((s) =>
                  s.id === stepId
                    ? { ...s, kind: "tool-rejected" as StreamStepKind, text: "Ejecución cancelada por el usuario." }
                    : s
                ),
              }
            }),
          }
        })
      )
      setVisibleSteps((prev) => new Set([...prev, stepId]))
      setIsStreaming(false)
    },
    [activeConvId]
  )

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMessage = useCallback(() => {
    const text = inputText.trim()
    if (!text || isStreaming) return
    setInputText("")

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", text }
    const steps = buildStreamSequence(text)
    const streamMsgId = crypto.randomUUID()
    const streamMsg: ChatMessage = { id: streamMsgId, role: "stream", steps }

    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id !== activeConvId) return conv
        return {
          ...conv,
          title: conv.messages.length === 0 ? text.slice(0, 50) : conv.title,
          messages: [...conv.messages, userMsg, streamMsg],
        }
      })
    )

    setIsStreaming(true)
    setPendingStreamMsgId(streamMsgId)
    revealSteps(steps, streamMsgId)
  }, [inputText, isStreaming, activeConvId, revealSteps])

  // ── Reset conversation ─────────────────────────────────────────────────────
  const handleReset = () => {
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConvId ? { ...c, messages: [] } : c))
    )
    setVisibleSteps(new Set())
    setIsStreaming(false)
    setPendingStreamMsgId(null)
  }

  // ── New conversation ───────────────────────────────────────────────────────
  const handleNewConversation = () => {
    const newConv: Conversation = {
      id: crypto.randomUUID(),
      title: "Nueva conversación",
      agentName: selectedAgent.name,
      agentInitials: selectedAgent.initials,
      agentColor: selectedAgent.color,
      timestamp: "Ahora",
      status: "active",
      messages: [],
    }
    setConversations((prev) => [newConv, ...prev])
    setActiveConvId(newConv.id)
    setVisibleSteps(new Set())
    setIsStreaming(false)
    setPendingStreamMsgId(null)
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full overflow-hidden" style={{ background: "#F7F8FA" }}>

      {/* ── Left panel: inbox ────────────────────────────────────────── */}
      <aside
        className="w-[280px] shrink-0 flex flex-col border-r"
        style={{ background: "#FFFFFF", borderColor: "rgba(145,158,171,0.2)" }}
      >
        <div className="px-4 py-4 border-b flex items-center justify-between shrink-0" style={{ borderColor: "rgba(145,158,171,0.2)" }}>
          <div>
            <p className="text-sm font-bold" style={{ color: "#1C2434" }}>Conversaciones</p>
            <p className="text-xs" style={{ color: "#637381" }}>{conversations.length} sesiones</p>
          </div>
          <button
            onClick={handleNewConversation}
            className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: "#F4F6F8" }}
            title="Nueva conversación"
          >
            <Plus className="h-4 w-4" style={{ color: "#1C2434" }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {conversations.map((conv) => {
            const isActive = conv.id === activeConvId
            const statusIcon =
              conv.status === "pending-approval" ? (
                <Clock className="h-3 w-3 shrink-0" style={{ color: "#D97706" }} />
              ) : conv.status === "done" ? (
                <CheckCircle2 className="h-3 w-3 shrink-0" style={{ color: "#059669" }} />
              ) : (
                <MessageSquare className="h-3 w-3 shrink-0" style={{ color: "#637381" }} />
              )

            return (
              <button
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                className="w-full text-left px-3 py-3 mx-1 rounded-xl transition-colors"
                style={{
                  width: "calc(100% - 8px)",
                  background: isActive ? "#F0EEFF" : "transparent",
                }}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className="h-7 w-7 rounded-lg shrink-0 flex items-center justify-center text-white text-[10px] font-bold mt-0.5"
                    style={{ background: conv.agentColor }}
                  >
                    {conv.agentInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-medium truncate"
                      style={{ color: isActive ? "#5E24D5" : "#1C2434" }}
                    >
                      {conv.title}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {statusIcon}
                      <span className="text-[10px] truncate" style={{ color: "#637381" }}>
                        {conv.timestamp}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </aside>

      {/* ── Right: chat area ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <div
          className="h-14 px-5 border-b flex items-center justify-between shrink-0"
          style={{ background: "#FFFFFF", borderColor: "rgba(145,158,171,0.2)" }}
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold" style={{ color: "#637381" }}>Probando agente</span>

            {/* Agent selector */}
            <div className="relative">
              <button
                onClick={() => setAgentDropdownOpen(!agentDropdownOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border transition-colors"
                style={{ background: "#F4F6F8", borderColor: "rgba(145,158,171,0.2)" }}
              >
                <div
                  className="h-6 w-6 rounded-md flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                  style={{ background: selectedAgent.color }}
                >
                  {selectedAgent.initials}
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold leading-none" style={{ color: "#1C2434" }}>{selectedAgent.name}</p>
                  <p className="text-[10px] leading-none mt-0.5" style={{ color: "#637381" }}>{selectedAgent.description}</p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 ml-1" style={{ color: "#637381" }} />
              </button>
              {agentDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-56 rounded-xl border shadow-lg z-50 overflow-hidden" style={{ background: "#FFFFFF", borderColor: "rgba(145,158,171,0.2)" }}>
                  {AGENTS.map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => { setSelectedAgentId(agent.id); setAgentDropdownOpen(false) }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
                    >
                      <div className="h-7 w-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ background: agent.color }}>
                        {agent.initials}
                      </div>
                      <div>
                        <p className="text-xs font-medium" style={{ color: "#1C2434" }}>{agent.name}</p>
                        <p className="text-[10px]" style={{ color: "#637381" }}>{agent.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Environment badge */}
            <div className="relative">
              <button
                onClick={() => setEnvDropdownOpen(!envDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{ background: "#D1FAE5", color: "#065F46" }}
              >
                Producción
                <ChevronDown className="h-3 w-3" />
              </button>
              {envDropdownOpen && (
                <div className="absolute top-full right-0 mt-1 w-40 rounded-xl border shadow-lg z-50 overflow-hidden" style={{ background: "#FFFFFF", borderColor: "rgba(145,158,171,0.2)" }}>
                  {["Producción", "Staging", "Desarrollo"].map((env) => (
                    <button key={env} onClick={() => setEnvDropdownOpen(false)} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors" style={{ color: "#1C2434" }}>
                      {env}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleReset}
              className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors"
              style={{ background: "#F4F6F8" }}
              title="Reiniciar chat"
            >
              <RotateCcw className="h-3.5 w-3.5" style={{ color: "#637381" }} />
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {!activeConv || activeConv.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 opacity-50">
              <MessageSquare className="h-10 w-10" style={{ color: "#637381" }} />
              <p className="text-sm" style={{ color: "#637381" }}>Escribe un mensaje para comenzar</p>
            </div>
          ) : (
            activeConv.messages.map((msg) => {
              // ── User message ────────────────────────────────────────────
              if (msg.role === "user") {
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div
                      className="px-4 py-2.5 rounded-xl text-sm text-white max-w-[65%]"
                      style={{ background: "#D4009A", borderRadius: "16px 16px 4px 16px" }}
                    >
                      {msg.text}
                    </div>
                  </div>
                )
              }

              // ── Stream message ──────────────────────────────────────────
              const isOldConv = pendingStreamMsgId !== msg.id
              const stepVisible = (sid: string) => isOldConv || visibleSteps.has(sid)

              const logSteps = (msg.steps ?? []).filter(
                (s) => !["tool-approval","tool-executed","tool-rejected","response","agent-thinking"].includes(s.kind)
              )
              const thinkingStep = (msg.steps ?? []).find((s) => s.kind === "agent-thinking")
              const actionSteps = (msg.steps ?? []).filter(
                (s) => ["tool-approval","tool-executed","tool-rejected"].includes(s.kind)
              )
              const responseStep = (msg.steps ?? []).find((s) => s.kind === "response")

              return (
                <div key={msg.id} className="flex flex-col gap-2.5" style={{ maxWidth: "72%" }}>
                  {/* Agent label */}
                  <div className="flex items-center gap-2">
                    <div
                      className="h-7 w-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                      style={{ background: activeConv.agentColor }}
                    >
                      {activeConv.agentInitials}
                    </div>
                    <span className="text-xs font-semibold" style={{ color: "#1C2434" }}>{activeConv.agentName}</span>
                  </div>

                  {/* Log steps card */}
                  {logSteps.some((s) => stepVisible(s.id)) && (
                    <div
                      className="rounded-xl border px-4 py-3 space-y-1.5"
                      style={{ background: "#FAFBFC", borderColor: "rgba(145,158,171,0.2)", borderRadius: "4px 16px 16px 16px" }}
                    >
                      {logSteps.map((step) =>
                        stepVisible(step.id) ? (
                          <StreamStepRow
                            key={step.id}
                            step={step}
                            visible={true}
                            onApprove={(sid) => handleApprove(sid, msg.id)}
                            onReject={(sid) => handleReject(sid, msg.id)}
                          />
                        ) : null
                      )}
                    </div>
                  )}

                  {/* Thinking block */}
                  {thinkingStep && stepVisible(thinkingStep.id) && (
                    <div
                      className="rounded-xl border px-4 py-3 flex items-center gap-3"
                      style={{ background: "#F9F0FF", borderColor: "rgba(94,36,213,0.15)", borderRadius: "4px 16px 16px 16px" }}
                    >
                      <Cpu className="h-4 w-4 shrink-0" style={{ color: "#5E24D5" }} />
                      <span className="text-xs flex-1" style={{ color: "#5E24D5" }}>{thinkingStep.text}</span>
                      {!isOldConv && (
                        <span className="inline-flex items-center gap-0.5">
                          {[0, 1, 2].map((i) => (
                            <span
                              key={i}
                              className="h-1.5 w-1.5 rounded-full"
                              style={{
                                background: "#5E24D5",
                                animation: `thinking-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                              }}
                            />
                          ))}
                        </span>
                      )}
                    </div>
                  )}

                  {/* HITL / tool result block */}
                  {actionSteps.map((step) =>
                    stepVisible(step.id) ? (
                      <StreamStepRow
                        key={step.id}
                        step={step}
                        visible={true}
                        onApprove={(sid) => handleApprove(sid, msg.id)}
                        onReject={(sid) => handleReject(sid, msg.id)}
                      />
                    ) : null
                  )}

                  {/* Response */}
                  {responseStep && stepVisible(responseStep.id) && (
                    <div
                      className="rounded-xl border px-4 py-3 text-sm leading-relaxed"
                      style={{ background: "#FFFFFF", borderColor: "rgba(145,158,171,0.2)", color: "#1C2434", borderRadius: "4px 16px 16px 16px" }}
                    >
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                          ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-1.5">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-1.5">{children}</ol>,
                          li: ({ children }) => <li>{children}</li>,
                          code: ({ children }) => (
                            <code className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: "#F1F5F9", color: "#0F2870" }}>
                              {children}
                            </code>
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-2 pl-3 italic" style={{ borderColor: "#D4009A", color: "#637381" }}>
                              {children}
                            </blockquote>
                          ),
                          a: ({ href, children }) => (
                            <a href={href} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "#D4009A" }}>
                              {children}
                            </a>
                          ),
                        }}
                      >
                        {responseStep.responseText ?? ""}
                      </ReactMarkdown>
                    </div>
                  )}

                  {/* Streaming indicator */}
                  {!isOldConv && isStreaming && (
                    <div className="flex items-center gap-2 px-1">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: "#D4009A" }} />
                      <span className="text-xs" style={{ color: "#637381" }}>Procesando...</span>
                    </div>
                  )}
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div
          className="px-5 py-4 border-t shrink-0"
          style={{ background: "#FFFFFF", borderColor: "rgba(145,158,171,0.2)" }}
        >
          <div
            className="flex items-end gap-3 rounded-2xl border px-4 py-3"
            style={{ borderColor: "rgba(145,158,171,0.3)", background: "#FAFBFC" }}
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              placeholder="Escribe tu mensaje..."
              className="flex-1 resize-none bg-transparent text-sm outline-none"
              style={{ color: "#1C2434", maxHeight: 120 }}
              disabled={isStreaming}
            />
            <button
              onClick={sendMessage}
              disabled={!inputText.trim() || isStreaming}
              className={cn(
                "h-8 w-8 rounded-xl flex items-center justify-center transition-all shrink-0",
                inputText.trim() && !isStreaming ? "opacity-100" : "opacity-40"
              )}
              style={{ background: "#D4009A" }}
            >
              <Send className="h-4 w-4 text-white" />
            </button>
          </div>
          <p className="text-center text-[10px] mt-2" style={{ color: "#B0B8C1" }}>
            Presiona Enter para enviar · Shift+Enter para nueva línea
          </p>
        </div>
      </div>

      {/* Thinking dot animation */}
      <style>{`
        @keyframes thinking-dot {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
