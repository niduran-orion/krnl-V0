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
  ChevronRight,
  AlertTriangle,
  Code2,
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

// ─── Mock data ────────────────────────────────────────────────────────────────

const AGENTS = [
  {
    id: "a1",
    name: "RRHH - Políticas",
    desc: "Responde consult...",
    initials: "RR",
    color: "#D4009A",
    env: "Producción",
  },
  {
    id: "a2",
    name: "Agente Comercial",
    desc: "Ventas y cotizaciones",
    initials: "AC",
    color: "#0F2870",
    env: "Staging",
  },
  {
    id: "a3",
    name: "Soporte Técnico",
    desc: "IT helpdesk",
    initials: "ST",
    color: "#5E24D5",
    env: "Producción",
  },
]

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: "c1",
    title: "¿Cuáles son las políticas de vacaciones?",
    agentName: "RRHH - Políticas",
    agentInitials: "RR",
    agentColor: "#D4009A",
    timestamp: "Hace 10 min",
    status: "done",
    messages: [
      {
        id: "m1",
        role: "user",
        text: "¿Cuáles son las políticas de vacaciones?",
      },
      {
        id: "m2",
        role: "stream",
        steps: [
          {
            id: "s1",
            kind: "guardrail-ok",
            text: "Guardrail: Validando integridad del prompt... OK",
          },
          {
            id: "s2",
            kind: "supervisor-assigned",
            text: "Supervisor: Tarea asignada a:",
            subText: "Ag. Conocimiento RRHH",
          },
          {
            id: "s3",
            kind: "response",
            text: "",
            responseText:
              "Según la documentación de RRHH, las políticas de vacaciones establecen que:\n\n1. Cada empleado tiene derecho a **15 días hábiles** de vacaciones al año\n2. Las vacaciones deben solicitarse con al menos **2 semanas** de anticipación\n3. Se pueden fraccionar en períodos mínimos de **5 días**",
          },
        ],
      },
      {
        id: "m3",
        role: "user",
        text: "¿Y los días administrativos?",
      },
      {
        id: "m4",
        role: "stream",
        steps: [
          {
            id: "s5",
            kind: "guardrail-ok",
            text: "Guardrail: Validando integridad del prompt... OK",
          },
          {
            id: "s6",
            kind: "supervisor-assigned",
            text: "Supervisor: Tarea asignada a:",
            subText: "Ag. Conocimiento RRHH",
          },
          {
            id: "s7",
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
    agentName: "Agente Comercial",
    agentInitials: "AC",
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
            text: "Ag. Herramientas esta procesando la solicitud...",
          },
          {
            id: "c2-step4",
            kind: "tool-approval",
            text: "Accion requiere aprobacion",
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
    title: "Consultar pipeline de ventas Q1",
    agentName: "Agente Comercial",
    agentInitials: "AC",
    agentColor: "#0F2870",
    timestamp: "Hace 1h",
    status: "done",
    messages: [],
  },
  {
    id: "c4",
    title: "Resetear contraseña usuario maria@corp.com",
    agentName: "Soporte Técnico",
    agentInitials: "ST",
    agentColor: "#5E24D5",
    timestamp: "Ayer",
    status: "done",
    messages: [],
  },
]

// ─── Simulation helpers ───────────────────────────────────────────────────────

function buildStreamSequence(userText: string): StreamStep[] {
  const lower = userText.toLowerCase()
  const wantsTool =
    lower.includes("crea") ||
    lower.includes("envia") ||
    lower.includes("envía") ||
    lower.includes("repositorio") ||
    lower.includes("email") ||
    lower.includes("mail") ||
    lower.includes("consulta")

  const toolData: ToolApprovalData | undefined = wantsTool
    ? lower.includes("mail") || lower.includes("email")
      ? {
          toolName: "Enviar Email",
          integration: "Gmail / SMTP",
          icon: "mail",
          params: {
            Para: "usuario@empresa.com",
            Asunto: "Respuesta automática agente",
            Cuerpo: userText.slice(0, 60) + "...",
          },
        }
      : lower.includes("repositorio")
      ? {
          toolName: "Crear Repositorio",
          integration: "GitHub",
          icon: "github",
          params: {
            "Repo Name": "new-project",
            Visibility: "private",
            Template: "node-typescript",
          },
        }
      : {
          toolName: "Ejecutar Query",
          integration: "BigQuery / CRM",
          icon: "database",
          params: {
            Query: `SELECT * FROM sales WHERE period = 'Q1'`,
            Dataset: "analytics_prod",
            Limit: "500",
          },
        }
    : undefined

  const steps: StreamStep[] = [
    {
      id: crypto.randomUUID(),
      kind: "guardrail-checking",
      text: "Guardrail: Validando integridad del prompt...",
    },
    {
      id: crypto.randomUUID(),
      kind: "guardrail-ok",
      text: "Guardrail: Validando integridad del prompt... OK",
    },
    {
      id: crypto.randomUUID(),
      kind: "supervisor-analyzing",
      text: "Supervisor: Analizando intención del usuario...",
    },
    {
      id: crypto.randomUUID(),
      kind: "supervisor-assigned",
      text: "Supervisor: Tarea asignada a:",
      subText: wantsTool ? "Ag. Herramientas" : "Ag. Conocimiento",
    },
    {
      id: crypto.randomUUID(),
      kind: "agent-thinking",
      text: wantsTool ? "Ag. Herramientas está procesando la solicitud..." : "Ag. Conocimiento está procesando la solicitud...",
    },
  ]

  if (toolData) {
    steps.push({
      id: crypto.randomUUID(),
      kind: "tool-approval",
      text: "Accion requiere aprobacion",
      toolData,
    })
  } else {
    steps.push({
      id: crypto.randomUUID(),
      kind: "response",
      text: "",
      responseText: generateMockResponse(userText),
    })
  }

  return steps
}

function generateMockResponse(input: string): string {
  const lower = input.toLowerCase()
  if (lower.includes("vacacion") || lower.includes("permiso"))
    return "Según nuestra política de RRHH:\n\n1. Tienes derecho a **15 días hábiles** anuales\n2. La solicitud debe hacerse con **2 semanas** de anticipación\n3. Puedes fraccionar en bloques de mínimo **5 días**"
  if (lower.includes("salario") || lower.includes("sueldo"))
    return "Las consultas de salario deben realizarse directamente con **Recursos Humanos**.\n\nPuedes contactarlos en: `rrhh@empresa.com`"
  return `He procesado tu consulta: *"${input}"*\n\nBasándome en la información disponible, te puedo confirmar que la solicitud ha sido registrada correctamente. ¿Hay algo más en lo que pueda ayudarte?`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusDot({ status }: { status: ConvStatus }) {
  if (status === "pending-approval")
    return (
      <span
        className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
        style={{ background: "#FEF3C7", color: "#B45309" }}
      >
        <Clock className="h-2.5 w-2.5" />
        Pendiente
      </span>
    )
  if (status === "done")
    return <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: "#10B981" }} />
  return <div className="h-2 w-2 rounded-full shrink-0" style={{ background: "#D4009A" }} />
}

function ToolIcon({ icon }: { icon: ToolApprovalData["icon"] }) {
  const cls = "h-5 w-5"
  if (icon === "mail") return <Mail className={cls} />
  if (icon === "database") return <Database className={cls} />
  if (icon === "github") return <GitBranch className={cls} />
  return <Wrench className={cls} />
}

function StreamStepRow({
  step,
  visible,
  onApprove,
  onReject,
}: {
  step: StreamStep
  visible: boolean
  onApprove?: (stepId: string) => void
  onReject?: (stepId: string) => void
}) {
  if (!visible) return null

  // ── Guardrail rows ──
  if (step.kind === "guardrail-checking") {
    return (
      <div className="flex items-center gap-2 text-xs" style={{ color: "#637381" }}>
        <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" style={{ color: "#94A3B8" }} />
        <Shield className="h-3.5 w-3.5 shrink-0" style={{ color: "#94A3B8" }} />
        <span>{step.text}</span>
      </div>
    )
  }
  if (step.kind === "guardrail-ok") {
    return (
      <div className="flex items-center gap-2 text-xs" style={{ color: "#637381" }}>
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: "#10B981" }} />
        <Shield className="h-3.5 w-3.5 shrink-0" style={{ color: "#10B981" }} />
        <span>{step.text}</span>
      </div>
    )
  }
  if (step.kind === "guardrail-blocked") {
    return (
      <div className="flex items-center gap-2 text-xs" style={{ color: "#DC2626" }}>
        <XCircle className="h-3.5 w-3.5 shrink-0" />
        <Shield className="h-3.5 w-3.5 shrink-0" />
        <span>{step.text}</span>
      </div>
    )
  }

  // ── Supervisor rows ──
  if (step.kind === "supervisor-analyzing") {
    return (
      <div className="flex items-center gap-2 text-xs" style={{ color: "#637381" }}>
        <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" style={{ color: "#94A3B8" }} />
        <Brain className="h-3.5 w-3.5 shrink-0" style={{ color: "#5E24D5" }} />
        <span>{step.text}</span>
      </div>
    )
  }
  if (step.kind === "supervisor-assigned") {
    return (
      <div className="flex items-center gap-2 text-xs" style={{ color: "#637381" }}>
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: "#10B981" }} />
        <Brain className="h-3.5 w-3.5 shrink-0" style={{ color: "#5E24D5" }} />
        <span>
          {step.text}{" "}
          <span className="font-semibold" style={{ color: "#0F2870" }}>
            {step.subText}
          </span>
        </span>
      </div>
    )
  }

  // ── Agent thinking ──
  if (step.kind === "agent-thinking") {
    return (
      <div className="flex items-center gap-2 text-xs" style={{ color: "#637381" }}>
        <ThinkingDots />
        <Cpu className="h-3.5 w-3.5 shrink-0" style={{ color: "#D4009A" }} />
        <span>{step.text}</span>
      </div>
    )
  }

  // ── Tool approval ──
  if (step.kind === "tool-approval" && step.toolData) {
    const td = step.toolData
    return (
      <div
        className="rounded-xl border-2 overflow-hidden"
        style={{ borderColor: "#FCD34D", background: "#FFFBEB" }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-2.5 px-4 py-3 border-b"
          style={{ borderColor: "#FDE68A", background: "#FEF3C7" }}
        >
          <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: "#B45309" }} />
          <span className="text-sm font-semibold" style={{ color: "#78350F" }}>
            Accion requiere aprobacion
          </span>
        </div>

        <div className="px-4 py-4 space-y-4">
          {/* Tool identity */}
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "#0F2870", color: "white" }}
            >
              <ToolIcon icon={td.icon} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#1C2434" }}>
                {td.toolName}
              </p>
              <p className="text-xs" style={{ color: "#637381" }}>
                {td.integration}
              </p>
            </div>
          </div>

          {/* Params */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Code2 className="h-3.5 w-3.5" style={{ color: "#637381" }} />
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#637381" }}>
                Parametros de entrada
              </span>
            </div>
            <div
              className="rounded-lg border divide-y text-xs font-mono overflow-hidden"
              style={{ borderColor: "#FDE68A", background: "#FFFEF5", divideColor: "#FDE68A" }}
            >
              {Object.entries(td.params).map(([k, v]) => (
                <div key={k} className="flex gap-2 px-3 py-2">
                  <span className="shrink-0 font-semibold" style={{ color: "#B45309" }}>
                    {k}:
                  </span>
                  <span className="break-all" style={{ color: "#1C2434" }}>
                    {v}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => onReject?.(step.id)}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-colors"
              style={{ borderColor: "#FCA5A5", color: "#DC2626", background: "#FFF5F5" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#FEE2E2")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#FFF5F5")}
            >
              <XCircle className="h-4 w-4" />
              Rechazar
            </button>
            <button
              onClick={() => onApprove?.(step.id)}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors"
              style={{ background: "#D4009A" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#A4097B")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#D4009A")}
            >
              <CheckCircle2 className="h-4 w-4" />
              Ejecutar
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Tool executed / rejected ──
  if (step.kind === "tool-executed") {
    return (
      <div className="flex items-center gap-2 text-xs" style={{ color: "#637381" }}>
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: "#10B981" }} />
        <Wrench className="h-3.5 w-3.5 shrink-0" style={{ color: "#10B981" }} />
        <span>{step.text}</span>
      </div>
    )
  }
  if (step.kind === "tool-rejected") {
    return (
      <div className="flex items-center gap-2 text-xs" style={{ color: "#DC2626" }}>
        <XCircle className="h-3.5 w-3.5 shrink-0" />
        <Wrench className="h-3.5 w-3.5 shrink-0" />
        <span>{step.text}</span>
      </div>
    )
  }

  // ── Final response ──
  if (step.kind === "response" && step.responseText) {
    return (
      <div
        className="rounded-xl border px-4 py-3 text-sm leading-relaxed"
        style={{ background: "#FFFFFF", borderColor: "rgba(145,158,171,0.2)", color: "#1C2434" }}
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
            a: ({ href, children }) => (
              <a href={href} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "#D4009A" }}>
                {children}
              </a>
            ),
          }}
        >
          {step.responseText}
        </ReactMarkdown>
      </div>
    )
  }

  return null
}

function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full"
          style={{
            background: "#D4009A",
            animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </span>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PlaygroundView() {
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS)
  const [activeConvId, setActiveConvId] = useState<string>("c1")
  const [selectedAgentId, setSelectedAgentId] = useState("a1")
  const [agentDropdownOpen, setAgentDropdownOpen] = useState(false)
  const [inputText, setInputText] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [visibleSteps, setVisibleSteps] = useState<Set<string>>(new Set())
  const [pendingStreamMsgId, setPendingStreamMsgId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const activeConv = conversations.find((c) => c.id === activeConvId)
  const selectedAgent = AGENTS.find((a) => a.id === selectedAgentId)!

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [activeConv?.messages, visibleSteps])

  const revealSteps = useCallback(
    (steps: StreamStep[], msgId: string) => {
      let i = 0
      const next = () => {
        if (i >= steps.length) {
          setIsStreaming(false)
          setPendingStreamMsgId(null)
          return
        }
        const step = steps[i]
        // If it's a tool-approval step, pause streaming and wait for user
        if (step.kind === "tool-approval") {
          setVisibleSteps((prev) => new Set([...prev, step.id]))
          setIsStreaming(false)
          // don't auto-continue — user must approve/reject
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
    },
    []
  )

  const handleApprove = useCallback(
    (stepId: string, msgId: string) => {
      // Replace tool-approval with tool-executed + response
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id !== activeConvId) return conv
          return {
            ...conv,
            messages: conv.messages.map((msg) => {
              if (msg.id !== msgId || !msg.steps) return msg
              const steps = msg.steps.map((s) =>
                s.id === stepId
                  ? {
                      ...s,
                      kind: "tool-executed" as StreamStepKind,
                      text: `${s.toolData?.toolName ?? "Herramienta"} ejecutada correctamente`,
                    }
                  : s
              )
              // Add response after executed
              const hasResponse = steps.some((s) => s.kind === "response")
              if (!hasResponse) {
                steps.push({
                  id: crypto.randomUUID(),
                  kind: "response",
                  text: "",
                  responseText: "La accion fue ejecutada exitosamente. El resultado ha sido procesado y registrado en el sistema.",
                })
              }
              return { ...msg, steps }
            }),
          }
        })
      )
      // Reveal remaining steps
      const conv = conversations.find((c) => c.id === activeConvId)
      const msg = conv?.messages.find((m) => m.id === msgId)
      if (msg?.steps) {
        const approvalIdx = msg.steps.findIndex((s) => s.id === stepId)
        const remaining = msg.steps.slice(approvalIdx + 1)
        // reveal already-replaced executed step
        setVisibleSteps((prev) => new Set([...prev, stepId]))
        setTimeout(() => {
          remaining.forEach((s, i) => {
            setTimeout(() => {
              setVisibleSteps((prev) => new Set([...prev, s.id]))
            }, i * 400)
          })
        }, 300)
      }
    },
    [activeConvId, conversations]
  )

  const handleReject = useCallback(
    (stepId: string, msgId: string) => {
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id !== activeConvId) return conv
          return {
            ...conv,
            messages: conv.messages.map((msg) => {
              if (msg.id !== msgId || !msg.steps) return msg
              return {
                ...msg,
                steps: msg.steps.map((s) =>
                  s.id === stepId
                    ? {
                        ...s,
                        kind: "tool-rejected" as StreamStepKind,
                        text: "Ejecucion cancelada por el usuario.",
                      }
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

  const sendMessage = useCallback(() => {
    const text = inputText.trim()
    if (!text || isStreaming) return
    setInputText("")

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text,
    }

    const steps = buildStreamSequence(text)
    const streamMsgId = crypto.randomUUID()
    const streamMsg: ChatMessage = {
      id: streamMsgId,
      role: "stream",
      steps,
    }

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

    let delay = 0
    steps.forEach((step) => {
      delay += step.kind === "agent-thinking" ? 600 : 450
      setTimeout(() => {
        if (step.kind === "tool-approval") {
          setIsStreaming(false)
        }
        setVisibleSteps((prev) => new Set([...prev, step.id]))
        if (step.kind === "response") {
          setIsStreaming(false)
          setPendingStreamMsgId(null)
        }
      }, delay)
    })
  }

  const handleReset = () => {
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConvId ? { ...c, messages: [] } : c))
    )
    setVisibleSteps(new Set())
    setIsStreaming(false)
  }

  return (
    <div className="flex h-full overflow-hidden" style={{ background: "#F7F8FA" }}>

      {/* ── Left panel: Conversation inbox ─────────────────────────── */}
      <aside
        className="w-[280px] shrink-0 flex flex-col border-r"
        style={{ background: "#FFFFFF", borderColor: "rgba(145,158,171,0.2)" }}
      >
        {/* Panel header */}
        <div
          className="px-4 py-4 border-b flex items-center justify-between shrink-0"
          style={{ borderColor: "rgba(145,158,171,0.2)" }}
        >
          <div>
            <p className="text-sm font-semibold" style={{ color: "#1C2434" }}>
              Conversaciones
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#637381" }}>
              {conversations.length} sesiones
            </p>
          </div>
          <button
            onClick={handleNewConversation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
            style={{ background: "#D4009A" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#A4097B")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#D4009A")}
          >
            <Plus className="h-3.5 w-3.5" />
            Nueva
          </button>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto py-2">
          {conversations.map((conv) => {
            const isActive = conv.id === activeConvId
            return (
              <button
                key={conv.id}
                onClick={() => {
                  setActiveConvId(conv.id)
                  setVisibleSteps(new Set())
                  setIsStreaming(false)
                }}
                className={cn(
                  "w-full text-left px-4 py-3 mx-0 flex gap-3 items-start transition-colors border-l-2",
                  isActive ? "border-l-[#D4009A]" : "border-l-transparent"
                )}
                style={isActive ? { background: "#FDF0FB" } : undefined}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "#F7F8FA" }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "" }}
              >
                {/* Agent avatar */}
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-white text-xs font-bold mt-0.5"
                  style={{ background: conv.agentColor }}
                >
                  {conv.agentInitials}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Title + status */}
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <p
                      className="text-xs font-semibold leading-snug line-clamp-2 flex-1"
                      style={{ color: isActive ? "#D4009A" : "#1C2434" }}
                    >
                      {conv.title}
                    </p>
                    <StatusDot status={conv.status} />
                  </div>
                  {/* Agent badge + timestamp */}
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded-full truncate max-w-[130px]"
                      style={{ background: "#F1F5F9", color: "#637381" }}
                    >
                      {conv.agentName}
                    </span>
                    <span className="text-[10px] shrink-0" style={{ color: "#94A3B8" }}>
                      {conv.timestamp}
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </aside>

      {/* ── Main chat area ──────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* Chat top bar */}
        <div
          className="h-14 shrink-0 flex items-center justify-between px-5 border-b"
          style={{ background: "#FFFFFF", borderColor: "rgba(145,158,171,0.2)" }}
        >
          {/* Left: title */}
          <div className="flex items-center gap-3">
            <MessageSquare className="h-4 w-4" style={{ color: "#637381" }} />
            <div>
              <p className="text-sm font-semibold leading-tight" style={{ color: "#1C2434" }}>
                Playground
              </p>
              <p className="text-xs leading-tight" style={{ color: "#94A3B8" }}>
                Prueba conversaciones y ajusta prompts/modelo (no-code)
              </p>
            </div>
          </div>

          {/* Right: agent selector + reset */}
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "#637381" }}>Probando agente</span>

            {/* Agent dropdown */}
            <div className="relative">
              <button
                onClick={() => setAgentDropdownOpen((v) => !v)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border text-sm font-medium transition-colors"
                style={{ borderColor: "rgba(145,158,171,0.32)", background: "#F7F8FA" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F5F9")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#F7F8FA")}
              >
                <div
                  className="h-6 w-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                  style={{ background: selectedAgent.color }}
                >
                  {selectedAgent.initials}
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold leading-tight" style={{ color: "#1C2434" }}>
                    {selectedAgent.name}
                  </p>
                  <p className="text-[10px] leading-tight" style={{ color: "#637381" }}>
                    {selectedAgent.desc}
                  </p>
                </div>
                <span
                  className="ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{ background: selectedAgent.env === "Producción" ? "#D1FAE5" : "#FEF3C7", color: selectedAgent.env === "Producción" ? "#065F46" : "#92400E" }}
                >
                  {selectedAgent.env}
                </span>
                <ChevronDown className="h-3.5 w-3.5 ml-1" style={{ color: "#637381" }} />
              </button>

              {agentDropdownOpen && (
                <div
                  className="absolute right-0 top-full mt-1 w-56 rounded-xl border shadow-lg z-50 overflow-hidden"
                  style={{ background: "#FFFFFF", borderColor: "rgba(145,158,171,0.2)" }}
                >
                  {AGENTS.map((ag) => (
                    <button
                      key={ag.id}
                      onClick={() => {
                        setSelectedAgentId(ag.id)
                        setAgentDropdownOpen(false)
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#F7F8FA")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                    >
                      <div
                        className="h-7 w-7 rounded-md flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                        style={{ background: ag.color }}
                      >
                        {ag.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold" style={{ color: "#1C2434" }}>
                          {ag.name}
                        </p>
                        <p className="text-[10px]" style={{ color: "#637381" }}>
                          {ag.desc}
                        </p>
                      </div>
                      {ag.id === selectedAgentId && (
                        <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "#D4009A" }} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Reset */}
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors"
              style={{ borderColor: "rgba(145,158,171,0.32)", color: "#637381" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#F4F6F8")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "")}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reiniciar chat
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
          {!activeConv || activeConv.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4" style={{ color: "#94A3B8" }}>
              <div
                className="h-14 w-14 rounded-2xl flex items-center justify-center"
                style={{ background: "#F1F5F9" }}
              >
                <MessageSquare className="h-7 w-7" style={{ color: "#C3CAD8" }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold" style={{ color: "#637381" }}>
                  Conversacion nueva
                </p>
                <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>
                  Escribe un mensaje para comenzar
                </p>
              </div>
            </div>
          ) : (
            activeConv.messages.map((msg) => {
              if (msg.role === "user") {
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div
                      className="max-w-[65%] rounded-2xl px-4 py-3 text-sm"
                      style={{ background: "#D4009A", color: "#FFFFFF", borderRadius: "16px 4px 16px 16px" }}
                    >
                      {msg.text}
                    </div>
                  </div>
                )
              }

              // Stream message — split steps into sections:
              // 1. log steps (guardrail, supervisor, thinking) → inside card
              // 2. tool-approval / tool-executed / tool-rejected → full-width block outside card
              // 3. response → outside card
              const isOldConv = !pendingStreamMsgId || pendingStreamMsgId !== msg.id
              const logSteps = (msg.steps ?? []).filter(
                (s) =>
                  s.kind !== "tool-approval" &&
                  s.kind !== "tool-executed" &&
                  s.kind !== "tool-rejected" &&
                  s.kind !== "response"
              )
              const actionSteps = (msg.steps ?? []).filter(
                (s) =>
                  s.kind === "tool-approval" ||
                  s.kind === "tool-executed" ||
                  s.kind === "tool-rejected"
              )
              const responseStep = (msg.steps ?? []).find((s) => s.kind === "response")

              const stepVisible = (stepId: string) =>
                isOldConv || visibleSteps.has(stepId)

              return (
                <div key={msg.id} className="flex flex-col gap-3 max-w-[80%]">
                  {/* Agent avatar row */}
                  <div className="flex items-center gap-2">
                    <div
                      className="h-7 w-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                      style={{ background: selectedAgent.color }}
                    >
                      {selectedAgent.initials}
                    </div>
                    <span className="text-xs font-semibold" style={{ color: "#1C2434" }}>
                      {selectedAgent.name}
                    </span>
                  </div>

                  {/* Log steps card (guardrail + supervisor lines) */}
                  {logSteps.filter((s) => s.kind !== "agent-thinking").some((s) => stepVisible(s.id)) && (
                    <div
                      className="rounded-xl border px-4 py-3 space-y-2"
                      style={{
                        background: "#FAFBFC",
                        borderColor: "rgba(145,158,171,0.2)",
                        borderRadius: "4px 16px 16px 16px",
                      }}
                    >
                      {logSteps
                        .filter((s) => s.kind !== "agent-thinking")
                        .map((step) => (
                          <StreamStepRow
                            key={step.id}
                            step={step}
                            visible={stepVisible(step.id)}
                            onApprove={(sid) => handleApprove(sid, msg.id)}
                            onReject={(sid) => handleReject(sid, msg.id)}
                          />
                        ))}
                    </div>
                  )}

                  {/* Thinking block — animated, separate from log card */}
                  {logSteps
                    .filter((s) => s.kind === "agent-thinking")
                    .map((step) =>
                      stepVisible(step.id) ? (
                        <div
                          key={step.id}
                          className="rounded-xl border px-4 py-3 flex items-center gap-3"
                          style={{
                            background: "#F9F0FF",
                            borderColor: "rgba(94,36,213,0.15)",
                            borderRadius: "4px 16px 16px 16px",
                          }}
                        >
                          <Cpu className="h-4 w-4 shrink-0" style={{ color: "#5E24D5" }} />
                          <span className="text-xs" style={{ color: "#5E24D5" }}>
                            {step.text}
                          </span>
                          {/* Only animate when streaming this message */}
                          {!isOldConv && (
                            <span className="inline-flex items-center gap-0.5 ml-1">
                              {[0, 1, 2].map((i) => (
                                <span
                                  key={i}
                                  className="h-1.5 w-1.5 rounded-full"
                                  style={{
                                    background: "#5E24D5",
                                    animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                                  }}
                                />
                              ))}
                            </span>
                          )}
                        </div>
                      ) : null
                    )}

                  {/* HITL / tool action block — full width, outside log card */}
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

                  {/* Final response — outside card, clean white bubble */}
                  {responseStep && stepVisible(responseStep.id) && (
                    <div
                      className="rounded-xl border px-4 py-3 text-sm leading-relaxed"
                      style={{
                        background: "#FFFFFF",
                        borderColor: "rgba(145,158,171,0.2)",
                        color: "#1C2434",
                        borderRadius: "4px 16px 16px 16px",
                      }}
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
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div
          className="shrink-0 px-8 py-4 border-t"
          style={{ background: "#FFFFFF", borderColor: "rgba(145,158,171,0.2)" }}
        >
          <div
            className="flex items-end gap-3 rounded-2xl border px-4 py-3 transition-colors"
            style={{
              borderColor: isStreaming ? "#D4009A" : "rgba(145,158,171,0.32)",
              background: "#FFFFFF",
              boxShadow: isStreaming ? "0 0 0 3px rgba(212,0,154,0.08)" : undefined,
            }}
          >
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              placeholder="Escribe tu mensaje..."
              rows={1}
              disabled={isStreaming}
              className="flex-1 resize-none bg-transparent text-sm outline-none leading-relaxed"
              style={{
                color: "#1C2434",
                minHeight: "24px",
                maxHeight: "160px",
              }}
              onInput={(e) => {
                const el = e.currentTarget
                el.style.height = "auto"
                el.style.height = Math.min(el.scrollHeight, 160) + "px"
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!inputText.trim() || isStreaming}
              className="h-9 w-9 rounded-xl flex items-center justify-center text-white shrink-0 transition-all"
              style={{
                background: inputText.trim() && !isStreaming ? "#D4009A" : "#E2E8F0",
              }}
            >
              {isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#94A3B8" }} />
              ) : (
                <Send className="h-4 w-4" style={{ color: inputText.trim() ? "#FFFFFF" : "#94A3B8" }} />
              )}
            </button>
          </div>
          <p className="text-center text-[11px] mt-2" style={{ color: "#94A3B8" }}>
            Presiona Enter para enviar &middot; Shift+Enter para nueva linea
          </p>
        </div>
      </div>

      {/* Close dropdown on outside click */}
      {agentDropdownOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setAgentDropdownOpen(false)} />
      )}
    </div>
  )
}
