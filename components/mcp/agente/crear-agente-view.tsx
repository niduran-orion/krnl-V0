"use client"

import { useState, useCallback } from "react"
import {
  ShieldCheck,
  Cpu,
  BookOpen,
  Wrench,
  Globe,
  CheckCircle2,
  X,
  ChevronRight,
  Mail,
  Search,
  Ticket,
  FileSearch,
  Database,
  Zap,
  GitPullRequest,
  CheckSquare,
  Square,
  ArrowLeft,
  Plus,
  Eye,
  Sliders,
  Send,
} from "lucide-react"
import Link from "next/link"

// ── Types ──────────────────────────────────────────────────────────────────

type NodeId =
  | "guardrail"
  | "main-agent"
  | "knowledge-agent"
  | "tools-agent"

type NodeStatus = "configured" | "active" | "pending" | "warning"

interface GraphNode {
  id: NodeId
  label: string
  sublabel: string
  status: NodeStatus
  icon: React.ElementType
  color: string
  bgColor: string
  borderColor: string
}

interface Collection {
  id: string
  name: string
  description: string
  sources: number
}

interface Tool {
  id: string
  name: string
  description: string
  icon: React.ElementType
}

// ── Mock data ──────────────────────────────────────────────────────────────

const mockCollections: Collection[] = [
  { id: "col-1", name: "Documentación Interna",          description: "Manuales y guías internas de la empresa",           sources: 45  },
  { id: "col-2", name: "Base de Conocimiento Soporte",   description: "Artículos y respuestas frecuentes de soporte",      sources: 128 },
  { id: "col-3", name: "Políticas y Procedimientos",     description: "Documentos de RRHH y políticas corporativas",       sources: 23  },
  { id: "col-4", name: "Catálogo de Productos",          description: "Especificaciones y fichas técnicas de productos",   sources: 67  },
]

const mockTools: Tool[] = [
  { id: "tool-email",   name: "Enviar email",              description: "Permite al agente enviar correos electrónicos",                icon: Mail         },
  { id: "tool-crm",     name: "Buscar en CRM",             description: "Consulta información de clientes en Salesforce",               icon: Search       },
  { id: "tool-ticket",  name: "Crear ticket",              description: "Crea tickets en sistema de soporte",                           icon: Ticket       },
  { id: "tool-docs",    name: "Buscar documentos",         description: "Busca en todas las colecciones conectadas",                    icon: FileSearch   },
  { id: "tool-web",     name: "Buscar en internet",        description: "Realiza búsquedas en la web en tiempo real",                   icon: Globe        },
  { id: "tool-db",      name: "Consultar base de datos",   description: "Ejecuta consultas SQL sobre bases de datos conectadas",        icon: Database     },
  { id: "tool-webhook", name: "Disparar webhook",          description: "Envía eventos a sistemas externos vía HTTP",                   icon: Zap          },
  { id: "tool-pr",      name: "Crear Pull Request",        description: "Abre pull requests en repositorios de GitHub",                 icon: GitPullRequest },
]

const GUARDRAIL_MODELS = ["Llama Guard 3", "Llama Guard 2", "Custom Policy"]
const MAIN_MODELS      = ["GPT-4o", "Claude 3.5 Sonnet", "Gemini 1.5 Pro", "Mistral Large"]
const CHANNELS         = ["Widget Web", "WhatsApp", "Slack", "API Directa"]

// ── Node definitions ───────────────────────────────────────────────────────

const NODES: GraphNode[] = [
  {
    id:          "guardrail",
    label:       "Guardrail",
    sublabel:    "Llama Guard 3",
    status:      "configured",
    icon:        ShieldCheck,
    color:       "#16A34A",
    bgColor:     "#F0FDF4",
    borderColor: "#BBF7D0",
  },
  {
    id:          "main-agent",
    label:       "Agente principal",
    sublabel:    "Pendiente de configurar",
    status:      "pending",
    icon:        Cpu,
    color:       "#1D4ED8",
    bgColor:     "#EFF6FF",
    borderColor: "#BFDBFE",
  },
  {
    id:          "knowledge-agent",
    label:       "Ag. Conocimiento",
    sublabel:    "mxbai-embed-large",
    status:      "active",
    icon:        BookOpen,
    color:       "#16A34A",
    bgColor:     "#F0FDF4",
    borderColor: "#BBF7D0",
  },
  {
    id:          "tools-agent",
    label:       "Ag. Herramientas",
    sublabel:    "Hereda modelo principal",
    status:      "active",
    icon:        Wrench,
    color:       "#D4009A",
    bgColor:     "#FFF0FA",
    borderColor: "#F9A8D4",
  },
]

// ── Status helpers ─────────────────────────────────────────────────────────

function StatusDot({ status }: { status: NodeStatus }) {
  const colors: Record<NodeStatus, string> = {
    configured: "#16A34A",
    active:     "#D4009A",
    pending:    "#F59E0B",
    warning:    "#EF4444",
  }
  return (
    <span
      className="h-2 w-2 rounded-full shrink-0"
      style={{ background: colors[status] }}
    />
  )
}

// ── SVG Graph ─────────────────────────────────────────────────────────────

interface GraphProps {
  selectedNode: NodeId | null
  onSelectNode: (id: NodeId) => void
  configuredNodes: Set<NodeId>
  onHoverNode: (id: NodeId | null) => void
}

type NodeTooltip = {
  message: string
  linkLabel?: string
  linkHref?: string
}

const NODE_TOOLTIPS: Record<NodeId, NodeTooltip> = {
  "guardrail": {
    message: "Tu primera linea de defensa. Define que puede y que no puede decir tu agente antes de responder.",
  },
  "main-agent": {
    message: "El cerebro de tu agente. Configura el modelo, la temperatura y las instrucciones que definen su personalidad y comportamiento.",
  },
  "knowledge-agent": {
    message: "Selecciona tus fuentes de verdad y evita alucinaciones. Recuerda que puedes configurar tus fuentes en",
    linkLabel: "Fuentes de datos",
    linkHref: "/fuentes-de-datos",
  },
  "tools-agent": {
    message: "Define las acciones que tu agente puede ejecutar: enviar emails, buscar en CRM, crear tickets y mas. Configura tus integraciones en",
    linkLabel: "Integraciones",
    linkHref: "/integraciones",
  },
}

function AgentGraph({ selectedNode, onSelectNode, configuredNodes, onHoverNode }: GraphProps) {

  // Layout constants — tall viewBox for prominence
  const W = 560
  const H = 520

  // Node positions — larger nodes, spread out for legibility
  const positions: Record<NodeId, { x: number; y: number; w: number; h: number }> = {
    "guardrail":       { x: 130, y: 30,  w: 300, h: 80 },
    "main-agent":      { x: 130, y: 170, w: 300, h: 80 },
    "knowledge-agent": { x: 10,  y: 340, w: 255, h: 88 },
    "tools-agent":     { x: 295, y: 340, w: 255, h: 88 },
  }

  const nodeData: Record<NodeId, GraphNode> = Object.fromEntries(
    NODES.map((n) => [n.id, n])
  ) as Record<NodeId, GraphNode>

  const statusColors: Record<NodeStatus, string> = {
    configured: "#16A34A",
    active:     "#D4009A",
    pending:    "#F59E0B",
    warning:    "#EF4444",
  }

  // Edges: [from, to]
  const edges: [NodeId, NodeId][] = [
    ["guardrail",  "main-agent"],
    ["main-agent", "knowledge-agent"],
    ["main-agent", "tools-agent"],
  ]

  const midX = (id: NodeId) => positions[id].x + positions[id].w / 2
  const botY = (id: NodeId) => positions[id].y + positions[id].h
  const topY = (id: NodeId) => positions[id].y

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-full"
      style={{ maxHeight: "100%" }}
    >
      {/* ── Edges ── */}
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5"
          markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#C4CDD5" />
        </marker>
        <marker id="arrow-active" viewBox="0 0 10 10" refX="9" refY="5"
          markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#D4009A" />
        </marker>
      </defs>

      {edges.map(([from, to]) => {
        const x1 = midX(from)
        const y1 = botY(from)
        const x2 = midX(to)
        const y2 = topY(to)
        // bezier control points
        const cy = (y1 + y2) / 2
        const isActive =
          configuredNodes.has(from) && configuredNodes.has(to)
        return (
          <path
            key={`${from}-${to}`}
            d={`M ${x1} ${y1} C ${x1} ${cy}, ${x2} ${cy}, ${x2} ${y2}`}
            fill="none"
            stroke={isActive ? "#D4009A" : "#E9ECEE"}
            strokeWidth={isActive ? 2 : 1.5}
            strokeDasharray={isActive ? "none" : "4 3"}
            markerEnd={isActive ? "url(#arrow-active)" : "url(#arrow)"}
          />
        )
      })}

      {/* ── Nodes ── */}
      {NODES.map((node) => {
        const { x, y, w, h } = positions[node.id]
        const isSelected = selectedNode === node.id
        const isConfigured = configuredNodes.has(node.id)
        const Icon = node.icon
        const rx = 14

        return (
          <g
            key={node.id}
            style={{ cursor: "pointer" }}
            onClick={() => onSelectNode(node.id)}
            onMouseEnter={() => onHoverNode(node.id)}
            onMouseLeave={() => onHoverNode(null)}
          >
            {/* Selection glow */}
            {isSelected && (
              <rect
                x={x - 4} y={y - 4}
                width={w + 8} height={h + 8}
                rx={rx + 4}
                fill="none"
                stroke="#D4009A"
                strokeWidth="2"
                opacity="0.4"
              />
            )}

            {/* Card background */}
            <rect
              x={x} y={y} width={w} height={h} rx={rx}
              fill={isSelected ? "#FFF0FA" : "#FFFFFF"}
              stroke={isSelected ? "#D4009A" : isConfigured ? node.borderColor : "#E9ECEE"}
              strokeWidth={isSelected ? 2 : 1.5}
            />

            {/* Icon circle */}
            <rect
              x={x + 16} y={y + h / 2 - 22}
              width={44} height={44} rx={10}
              fill={node.bgColor}
              stroke={node.borderColor}
              strokeWidth="1.5"
            />

            {/* Status dot */}
            <circle
              cx={x + w - 20}
              cy={y + h / 2}
              r={6}
              fill={statusColors[node.status]}
            />

            {/* Labels — rendered as foreignObject for proper text */}
            <foreignObject x={x + 70} y={y + 10} width={w - 100} height={h - 20}>
              <div
                xmlns="http://www.w3.org/1999/xhtml"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  height: "100%",
                }}
              >
                <p style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: isSelected ? "#D4009A" : "#1C2434",
                  lineHeight: 1.3,
                  margin: 0,
                }}>
                  {node.label}
                </p>
                <p style={{
                  fontSize: "12px",
                  color: "#637381",
                  margin: 0,
                  marginTop: "3px",
                }}>
                  {node.sublabel}
                </p>
              </div>
            </foreignObject>

            {/* Icon — rendered via foreignObject */}
            <foreignObject
              x={x + 16} y={y + h / 2 - 22}
              width={44} height={44}
            >
              <div
                xmlns="http://www.w3.org/1999/xhtml"
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="20" height="20"
                  fill="none"
                  stroke={node.color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {/* We inline SVG paths per icon to avoid React in foreignObject */}
                  {node.id === "guardrail"       && <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>}
                  {node.id === "main-agent"      && <><rect x="4" y="4" width="16" height="16" rx="2"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="9" r="1"/><path d="M9 15a3 3 0 006 0"/></>}
                  {node.id === "knowledge-agent" && <><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></>}
                  {node.id === "tools-agent"     && <><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></>}
                  {node.id === "publish"         && <><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></>}
                </svg>
              </div>
            </foreignObject>
          </g>
        )
      })}

      {/* ── Tap hint ── */}
      {!selectedNode && (
        <text
          x={W / 2} y={H - 10}
          textAnchor="middle"
          fontSize="13"
          fill="#C4CDD5"
        >
          Selecciona un nodo para configurarlo
        </text>
      )}
    </svg>
  )
}

// ── Config panels per node ─────────────────────────────────────────────────

function GuardrailPanel({ onClose }: { onClose: () => void }) {
  const [model, setModel] = useState(GUARDRAIL_MODELS[0])
  const [strictness, setStrictness] = useState(70)
  const [instructions, setInstructions] = useState("")

  return (
    <ConfigPanelShell title="Guardrail" subtitle="Protege al agente contra entradas maliciosas" onClose={onClose} color="#16A34A">
      <Field label="Modelo de seguridad">
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
          style={{ borderColor: "#E9ECEE", background: "#F7F8FA", color: "#1C2434" }}
        >
          {GUARDRAIL_MODELS.map((m) => <option key={m}>{m}</option>)}
        </select>
      </Field>

      <Field label={`Nivel de restricción: ${strictness}%`}>
        <input
          type="range" min={0} max={100} value={strictness}
          onChange={(e) => setStrictness(Number(e.target.value))}
          className="w-full accent-[#16A34A]"
        />
        <div className="flex justify-between text-[10px] mt-1" style={{ color: "#919EAB" }}>
          <span>Permisivo</span><span>Estricto</span>
        </div>
      </Field>

      <Field label="Instrucciones adicionales">
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Describe políticas personalizadas de seguridad..."
          rows={4}
          className="w-full resize-none rounded-xl border px-3 py-2.5 text-sm outline-none leading-relaxed"
          style={{ borderColor: "#E9ECEE", background: "#F7F8FA", color: "#1C2434" }}
        />
      </Field>

      <SaveButton />
    </ConfigPanelShell>
  )
}

function MainAgentPanel({ onClose }: { onClose: () => void }) {
  const [name, setName]               = useState("")
  const [role, setRole]               = useState("")
  const [model, setModel]             = useState(MAIN_MODELS[0])
  const [temperature, setTemperature] = useState(50)

  return (
    <ConfigPanelShell title="Agente principal" subtitle="Define el propósito, rol y modelo base" onClose={onClose} color="#1D4ED8">
      <Field label="Nombre del agente">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Agente de Ventas"
          className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
          style={{ borderColor: "#E9ECEE", background: "#F7F8FA", color: "#1C2434" }}
        />
      </Field>

      <Field label="Rol y objetivo">
        <textarea
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="Describe qué hace este agente y para quién..."
          rows={4}
          className="w-full resize-none rounded-xl border px-3 py-2.5 text-sm outline-none leading-relaxed"
          style={{ borderColor: "#E9ECEE", background: "#F7F8FA", color: "#1C2434" }}
        />
      </Field>

      <Field label="Modelo LLM">
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
          style={{ borderColor: "#E9ECEE", background: "#F7F8FA", color: "#1C2434" }}
        >
          {MAIN_MODELS.map((m) => <option key={m}>{m}</option>)}
        </select>
      </Field>

      <Field label={`Temperatura: ${(temperature / 100).toFixed(2)}`}>
        <input
          type="range" min={0} max={100} value={temperature}
          onChange={(e) => setTemperature(Number(e.target.value))}
          className="w-full accent-[#1D4ED8]"
        />
        <div className="flex justify-between text-[10px] mt-1" style={{ color: "#919EAB" }}>
          <span>Preciso</span><span>Creativo</span>
        </div>
      </Field>

      <SaveButton />
    </ConfigPanelShell>
  )
}

function KnowledgeAgentPanel({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [instructions, setInstructions] = useState("")

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <ConfigPanelShell title="Ag. Conocimiento" subtitle="Selecciona las colecciones de conocimiento" onClose={onClose} color="#16A34A">
      <div className="space-y-2">
        {mockCollections.map((col) => {
          const checked = selected.has(col.id)
          return (
            <button
              key={col.id}
              onClick={() => toggle(col.id)}
              className="w-full flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all"
              style={checked
                ? { borderColor: "#D4009A", background: "#FFF0FA" }
                : { borderColor: "#E9ECEE", background: "#FFFFFF" }
              }
            >
              {checked
                ? <CheckSquare className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#D4009A" }} />
                : <Square     className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#C4CDD5" }} />
              }
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: "#1C2434" }}>{col.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "#637381" }}>{col.description}</p>
                <span className="text-[10px] mt-1 inline-flex items-center gap-0.5" style={{ color: "#0891B2" }}>
                  <Eye className="h-3 w-3" /> {col.sources} fuentes
                </span>
              </div>
            </button>
          )
        })}
      </div>

      <Field label="Instrucciones de conocimiento">
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Indica cómo debe usar las fuentes seleccionadas..."
          rows={3}
          className="w-full resize-none rounded-xl border px-3 py-2.5 text-sm outline-none leading-relaxed"
          style={{ borderColor: "#E9ECEE", background: "#F7F8FA", color: "#1C2434" }}
        />
      </Field>

      <SaveButton />
    </ConfigPanelShell>
  )
}

function ToolsAgentPanel({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set(["tool-email"]))
  const [instructions, setInstructions] = useState("")

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <ConfigPanelShell title="Ag. Herramientas" subtitle="Habilita acciones e integraciones" onClose={onClose} color="#D4009A">
      <div className="space-y-2">
        {mockTools.map((tool) => {
          const checked = selected.has(tool.id)
          const Icon = tool.icon
          return (
            <button
              key={tool.id}
              onClick={() => toggle(tool.id)}
              className="w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all"
              style={checked
                ? { borderColor: "#D4009A", background: "#FFF0FA" }
                : { borderColor: "#E9ECEE", background: "#FFFFFF" }
              }
            >
              {checked
                ? <CheckSquare className="h-4 w-4 shrink-0" style={{ color: "#D4009A" }} />
                : <Square     className="h-4 w-4 shrink-0" style={{ color: "#C4CDD5" }} />
              }
              <Icon className="h-4 w-4 shrink-0" style={{ color: "#637381" }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: "#1C2434" }}>{tool.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "#637381" }}>{tool.description}</p>
              </div>
            </button>
          )
        })}
      </div>

      <Field label="Instrucciones de herramientas">
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Describe cuándo y cómo debe usar cada herramienta..."
          rows={3}
          className="w-full resize-none rounded-xl border px-3 py-2.5 text-sm outline-none leading-relaxed"
          style={{ borderColor: "#E9ECEE", background: "#F7F8FA", color: "#1C2434" }}
        />
      </Field>

      <SaveButton />
    </ConfigPanelShell>
  )
}

function PublishPanel({ onClose }: { onClose: () => void }) {
  const [channels, setChannels] = useState<Set<string>>(new Set())
  const [visibility, setVisibility] = useState<"public" | "private">("private")

  const toggle = (c: string) => {
    setChannels((prev) => {
      const next = new Set(prev)
      next.has(c) ? next.delete(c) : next.add(c)
      return next
    })
  }

  return (
    <ConfigPanelShell title="Publicar" subtitle="Define dónde estará disponible el agente" onClose={onClose} color="#0F2870">
      <Field label="Canales de publicación">
        <div className="space-y-2">
          {CHANNELS.map((ch) => {
            const checked = channels.has(ch)
            return (
              <button
                key={ch}
                onClick={() => toggle(ch)}
                className="w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all"
                style={checked
                  ? { borderColor: "#D4009A", background: "#FFF0FA" }
                  : { borderColor: "#E9ECEE", background: "#FFFFFF" }
                }
              >
                {checked
                  ? <CheckSquare className="h-4 w-4 shrink-0" style={{ color: "#D4009A" }} />
                  : <Square     className="h-4 w-4 shrink-0" style={{ color: "#C4CDD5" }} />
                }
                <span className="text-sm font-medium" style={{ color: "#1C2434" }}>{ch}</span>
              </button>
            )
          })}
        </div>
      </Field>

      <Field label="Visibilidad">
        <div className="flex gap-2">
          {(["public", "private"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setVisibility(v)}
              className="flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all capitalize"
              style={visibility === v
                ? { borderColor: "#0F2870", background: "#EFF6FF", color: "#0F2870" }
                : { borderColor: "#E9ECEE", background: "#FFFFFF", color: "#637381" }
              }
            >
              {v === "public" ? "Público" : "Privado"}
            </button>
          ))}
        </div>
      </Field>

      {/* Publish CTA */}
      <button
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-colors mt-2"
        style={{ background: "#D4009A" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#A4097B")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#D4009A")}
      >
        <Send className="h-4 w-4" />
        Publicar agente
      </button>
    </ConfigPanelShell>
  )
}

// ── Shared panel primitives ────────────────────────────────────────────────

function ConfigPanelShell({
  title,
  subtitle,
  onClose,
  color,
  children,
}: {
  title: string
  subtitle: string
  onClose: () => void
  color: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Panel header */}
      <div
        className="flex items-start justify-between px-6 py-5 border-b shrink-0"
        style={{ borderColor: "rgba(145,158,171,0.16)" }}
      >
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: color }}
            />
            <p className="text-base font-bold" style={{ color: "#1C2434" }}>{title}</p>
          </div>
          <p className="text-xs" style={{ color: "#637381" }}>{subtitle}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: "#919EAB" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#F4F6F8")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold" style={{ color: "#454F5B" }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function SaveButton() {
  const [saved, setSaved] = useState(false)
  const handle = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }
  return (
    <button
      onClick={handle}
      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
      style={saved
        ? { background: "#F0FDF4", color: "#16A34A", border: "1px solid #BBF7D0" }
        : { background: "#0F2870", color: "#FFFFFF" }
      }
      onMouseEnter={(e) => { if (!saved) e.currentTarget.style.background = "#0A1C50" }}
      onMouseLeave={(e) => { if (!saved) e.currentTarget.style.background = "#0F2870" }}
    >
      {saved ? (
        <><CheckCircle2 className="h-4 w-4" /> Guardado</>
      ) : (
        <><CheckCircle2 className="h-4 w-4" /> Guardar configuración</>
      )}
    </button>
  )
}

// ── Main view ─────────────────────────────────────────────────────────────

type ChatMsg = { role: "user" | "agent"; text: string }

const MOCK_AGENT_REPLIES = [
  "Entendido, déjame procesar tu consulta con la base de conocimiento configurada.",
  "Basándome en las colecciones conectadas, puedo ayudarte con eso. ¿Necesitas más detalles?",
  "He revisado la documentación interna. Aquí tienes lo que encontré.",
  "Con las herramientas que tengo disponibles, puedo gestionar eso. ¿Confirmas la acción?",
]

export function CrearAgenteView() {
  const [selectedNode, setSelectedNode] = useState<NodeId | null>(null)
  const [configuredNodes, setConfiguredNodes] = useState<Set<NodeId>>(
    new Set(["guardrail", "knowledge-agent"])
  )
  const [hoveredNode, setHoveredNode] = useState<NodeId | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    { role: "agent", text: "Hola, soy el agente que estás configurando. Prueba cómo respondo." },
  ])
  const [chatInput, setChatInput] = useState("")
  const [chatThinking, setChatThinking] = useState(false)
  const chatReplyIdx = useState(0)

  const handleSelectNode = useCallback((id: NodeId) => {
    setSelectedNode((prev) => (prev === id ? null : id))
  }, [])

  const handleClosePanel = useCallback(() => {
    setSelectedNode(null)
  }, [])

  const handleChatSend = useCallback(() => {
    const text = chatInput.trim()
    if (!text || chatThinking) return
    setChatMessages((prev) => [...prev, { role: "user", text }])
    setChatInput("")
    setChatThinking(true)
    setTimeout(() => {
      const reply = MOCK_AGENT_REPLIES[Math.floor(Math.random() * MOCK_AGENT_REPLIES.length)]
      setChatMessages((prev) => [...prev, { role: "agent", text: reply }])
      setChatThinking(false)
    }, 1200)
  }, [chatInput, chatThinking])

  const selectedNodeData = NODES.find((n) => n.id === selectedNode)

  return (
    <div className="flex flex-col h-full" style={{ background: "#F7F8FA" }}>

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-6 py-3.5 border-b shrink-0"
        style={{ background: "#FFFFFF", borderColor: "rgba(145,158,171,0.16)" }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="#"
            className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
            style={{ color: "#637381" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#0F2870")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#637381")}
          >
            <ArrowLeft className="h-4 w-4" />
            Agentes
          </Link>
          <span style={{ color: "#C4CDD5" }}>/</span>
          <span className="text-sm font-semibold" style={{ color: "#1C2434" }}>
            Crear nuevo agente
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Node legend pills */}
          {NODES.map((n) => {
            const isActive = selectedNode === n.id
            return (
              <button
                key={n.id}
                onClick={() => handleSelectNode(n.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                style={isActive
                  ? { borderColor: "#D4009A", background: "#FFF0FA", color: "#D4009A" }
                  : { borderColor: "#E9ECEE", background: "#FFFFFF", color: "#637381" }
                }
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: n.color }}
                />
                {n.label}
              </button>
            )
          })}

          <div className="w-px h-4 mx-1" style={{ background: "#E9ECEE" }} />

          <button
            onClick={() => setChatOpen((o) => !o)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-all"
            style={chatOpen
              ? { background: "#FFF0FA", borderColor: "#D4009A", color: "#D4009A" }
              : { background: "#FFFFFF", borderColor: "#E9ECEE", color: "#637381" }
            }
          >
            <Zap className="h-4 w-4" />
            Probar agente
          </button>

          <button
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ background: "#D4009A" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#A4097B")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#D4009A")}
          >
            <Plus className="h-4 w-4" />
            Guardar Agente
          </button>
        </div>
      </div>

      {/* ── Body: graph + optional config panel ──────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Graph canvas */}
        <div
          className="flex-1 flex flex-col overflow-hidden transition-all"
          style={{ background: "#F7F8FA" }}
        >
          {/* Graph area */}
          <div className="flex-1 flex items-center justify-center p-6">
            <div
              className="relative w-full h-full"
              style={{ maxWidth: "680px", maxHeight: "620px" }}
            >
              {/* Background grid dots */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ opacity: 0.4 }}
              >
                <defs>
                  <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="1" cy="1" r="1" fill="#C4CDD5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#dots)" />
              </svg>

              {/* The graph */}
              <AgentGraph
                selectedNode={selectedNode}
                onSelectNode={handleSelectNode}
                configuredNodes={configuredNodes}
                onHoverNode={setHoveredNode}
              />

              {/* ── Tooltip overlay (HTML, not SVG — no clipping) ── */}
              {hoveredNode && (() => {
                const tip = NODE_TOOLTIPS[hoveredNode]
                // viewBox coords → % of container
                // W=560, H=520 (the SVG viewBox)
                const W = 560, H = 520
                const pos = {
                  "guardrail":       { x: 130, y: 30,  w: 300, h: 80  },
                  "main-agent":      { x: 130, y: 170, w: 300, h: 80  },
                  "knowledge-agent": { x: 10,  y: 340, w: 255, h: 88  },
                  "tools-agent":     { x: 295, y: 340, w: 255, h: 88  },
                }[hoveredNode]
                const centerYPct = ((pos.y + pos.h / 2) / H) * 100
                const rightEdgePct = ((pos.x + pos.w) / W) * 100
                const leftEdgePct = (pos.x / W) * 100
                // place right if right-edge is before 60%, else left
                const placeRight = rightEdgePct < 60
                return (
                  <div
                    key={`tip-${hoveredNode}`}
                    style={{
                      position: "absolute",
                      top: `${centerYPct}%`,
                      transform: "translateY(-50%)",
                      ...(placeRight
                        ? { left: `calc(${rightEdgePct}% + 12px)` }
                        : { right: `calc(${100 - leftEdgePct}% + 12px)` }),
                      width: "220px",
                      zIndex: 50,
                      pointerEvents: "none",
                    }}
                  >
                    <div
                      style={{
                        background: "#1C2434",
                        color: "#FFFFFF",
                        borderRadius: "12px",
                        padding: "12px 14px",
                        fontSize: "12px",
                        lineHeight: "1.55",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.22)",
                      }}
                    >
                      <p style={{ margin: 0 }}>{tip.message}</p>
                      {tip.linkLabel && tip.linkHref && (
                        <a
                          href={tip.linkHref}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            marginTop: "8px",
                            fontSize: "11px",
                            fontWeight: 600,
                            color: "#D4009A",
                            background: "rgba(212,0,154,0.15)",
                            borderRadius: "6px",
                            padding: "3px 10px",
                            textDecoration: "none",
                            pointerEvents: "auto",
                          }}
                        >
                          → {tip.linkLabel}
                        </a>
                      )}
                    </div>
                    {/* Arrow tip */}
                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        transform: "translateY(-50%)",
                        ...(placeRight ? { left: "-6px" } : { right: "-6px" }),
                        width: 0,
                        height: 0,
                        borderTop: "6px solid transparent",
                        borderBottom: "6px solid transparent",
                        ...(placeRight
                          ? { borderRight: "6px solid #1C2434" }
                          : { borderLeft: "6px solid #1C2434" }),
                      }}
                    />
                  </div>
                )
              })()}
            </div>
          </div>

          {/* ── Mini test chat ──────────────────────────────────────────── */}
          {chatOpen && (
            <div
              className="shrink-0 border-t flex flex-col"
              style={{
                background: "#FFFFFF",
                borderColor: "rgba(145,158,171,0.16)",
                height: "260px",
                animation: "slideUpChat 0.18s ease-out",
              }}
            >
              {/* Chat header */}
              <div
                className="flex items-center justify-between px-4 py-2.5 border-b shrink-0"
                style={{ borderColor: "rgba(145,158,171,0.12)" }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-5 w-5 rounded-md flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg,#D4009A,#5E24D5)" }}
                  >
                    <Zap className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-xs font-semibold" style={{ color: "#1C2434" }}>
                    Probar agente
                  </span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{ background: "#F0FFF4", color: "#16A34A" }}
                  >
                    simulado
                  </span>
                </div>
                <button
                  onClick={() => setChatOpen(false)}
                  className="p-1 rounded-lg transition-colors hover:bg-slate-100"
                  style={{ color: "#637381" }}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {msg.role === "agent" && (
                      <div
                        className="h-5 w-5 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: "linear-gradient(135deg,#D4009A,#5E24D5)" }}
                      >
                        <Zap className="h-2.5 w-2.5 text-white" />
                      </div>
                    )}
                    <div
                      className="text-xs px-3 py-1.5 rounded-xl max-w-[75%] leading-relaxed"
                      style={
                        msg.role === "user"
                          ? { background: "#0F2870", color: "#FFFFFF", borderRadius: "12px 4px 12px 12px" }
                          : { background: "#F4F6F8", color: "#1C2434", borderRadius: "4px 12px 12px 12px" }
                      }
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {chatThinking && (
                  <div className="flex gap-2">
                    <div
                      className="h-5 w-5 rounded-md flex items-center justify-center shrink-0"
                      style={{ background: "linear-gradient(135deg,#D4009A,#5E24D5)" }}
                    >
                      <Zap className="h-2.5 w-2.5 text-white" />
                    </div>
                    <div
                      className="px-3 py-2 rounded-xl"
                      style={{ background: "#F4F6F8", borderRadius: "4px 12px 12px 12px" }}
                    >
                      <div className="flex gap-1 items-center">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="h-1.5 w-1.5 rounded-full"
                            style={{
                              background: "#D4009A",
                              animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div
                className="shrink-0 px-4 py-2.5 border-t flex items-center gap-2"
                style={{ borderColor: "rgba(145,158,171,0.12)" }}
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleChatSend()}
                  placeholder="Escribe un mensaje para probar el agente..."
                  className="flex-1 text-xs outline-none bg-transparent placeholder:text-[#9AA3B0]"
                  style={{ color: "#1C2434" }}
                  disabled={chatThinking}
                />
                <button
                  onClick={handleChatSend}
                  disabled={!chatInput.trim() || chatThinking}
                  className="h-6 w-6 rounded-lg flex items-center justify-center transition-all shrink-0"
                  style={
                    chatInput.trim() && !chatThinking
                      ? { background: "#D4009A", color: "#FFFFFF" }
                      : { background: "#E5E7EB", color: "#9CA3AF" }
                  }
                >
                  <Send className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Config panel — slides in when a node is selected */}
        {selectedNode && (
          <div
            className="w-[380px] shrink-0 border-l flex flex-col overflow-hidden"
            style={{
              background: "#FFFFFF",
              borderColor: "rgba(145,158,171,0.16)",
              animation: "slideInRight 0.18s ease-out",
            }}
          >
            {selectedNode === "guardrail"       && <GuardrailPanel     onClose={handleClosePanel} />}
            {selectedNode === "main-agent"      && <MainAgentPanel     onClose={handleClosePanel} />}
            {selectedNode === "knowledge-agent" && <KnowledgeAgentPanel onClose={handleClosePanel} />}
            {selectedNode === "tools-agent"     && <ToolsAgentPanel    onClose={handleClosePanel} />}
            {selectedNode === "publish"         && <PublishPanel       onClose={handleClosePanel} />}
          </div>
        )}
      </div>

      {/* ── Slide-in animation ─────────────────────────────────────────── */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(24px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes slideUpChat {
          from { transform: translateY(16px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%           { transform: scale(1);   opacity: 1;   }
        }
      `}</style>
    </div>
  )
}
