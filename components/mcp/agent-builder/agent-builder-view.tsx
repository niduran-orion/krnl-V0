"use client"

import { useState, useRef, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  Plus,
  Search,
  Send,
  Trash2,
  MoreHorizontal,
  Pencil,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  Bot,
  Check,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ── Types ─────────────────────────────────────────────────────────────────────

type Role = "user" | "assistant"

interface Message {
  id: string
  role: Role
  content: string
  thinking?: boolean
}

interface Conversation {
  id: string
  title: string
  updatedAt: string
  messages: Message[]
}

// ── Sample data ───────────────────────────────────────────────────────────────

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  content: `Hola, soy **KRNL Agent** — tu asistente para construir agentes CORE.

Puedo ayudarte a:

- Definir el **objetivo y personalidad** de tu agente
- Configurar su **base de conocimiento** (fuentes y colecciones)
- Seleccionar **herramientas** y capacidades
- Ajustar los **parámetros del modelo** (temperatura, contexto, guardrails)
- Publicar y conectar tu agente a canales

¿Con qué tipo de agente quieres empezar?`,
}

const INITIAL_CONVS: Conversation[] = [
  {
    id: "c1",
    title: "Agente de soporte técnico",
    updatedAt: "Hace 2 h",
    messages: [
      WELCOME,
      { id: "u1", role: "user", content: "Quiero crear un agente de soporte técnico para mi empresa." },
      {
        id: "a1",
        role: "assistant",
        content: `Perfecto. Para empezar necesito entender el contexto:

1. **¿Qué producto o servicio** soportará el agente?
2. **¿Cuál es el canal principal?** (chat web, WhatsApp, Slack, etc.)
3. **¿Tienes documentación existente?** (manuales, FAQs, tickets resueltos)

Con esta información podré sugerirte la arquitectura ideal.`,
      },
    ],
  },
  {
    id: "c2",
    title: "Agente comercial RRHH",
    updatedAt: "Ayer",
    messages: [
      WELCOME,
      { id: "u2", role: "user", content: "Necesito un agente para responder preguntas de RRHH." },
      {
        id: "a2",
        role: "assistant",
        content: `Un agente de RRHH es ideal para automatizar consultas frecuentes sobre vacaciones, beneficios y políticas internas.

Te recomiendo empezar con:
- **Colección de conocimiento**: subir el manual de empleados y políticas
- **Guardrail**: limitar respuestas solo a temas laborales
- **Canal**: Widget Web para el portal interno

¿Tienes los documentos de RRHH listos para subir?`,
      },
    ],
  },
  {
    id: "c3",
    title: "Bot de ventas ecommerce",
    updatedAt: "Hace 3 días",
    messages: [WELCOME],
  },
]

const SUGGESTIONS = [
  "Crear un agente de atención al cliente",
  "Ayúdame a configurar un agente de ventas",
  "Quiero un bot para responder preguntas de RRHH",
  "Construir un agente que busque en mi CRM",
]

// Simulated KRNL Agent responses
const KRNL_RESPONSES: Record<number, string> = {
  0: `Entendido. Para construir ese agente necesito definir tres pilares:

**1. Objetivo**
¿Cuál es la tarea principal del agente? (responder preguntas, ejecutar acciones, calificar leads, etc.)

**2. Conocimiento**
¿Qué información debe conocer? (documentos, base de datos, APIs externas)

**3. Herramientas**
¿Necesita hacer algo además de responder? (enviar emails, crear tickets, buscar en CRM)

Cuéntame más sobre tu caso de uso y te armo la configuración.`,
  1: `Perfecto. Basándome en lo que me comentas, te sugiero esta arquitectura:

\`\`\`
Agente Principal
├── Guardrail: Llama Guard 3
├── Colección: docs-cliente
├── Herramientas: Buscar CRM, Crear ticket
└── Modelo: GPT-4o mini (temperatura: 0.3)
\`\`\`

¿Quieres que empecemos configurando el **Objetivo** o prefieres subir los documentos primero?`,
  2: `Excelente elección. Para el canal que mencionas te recomiendo:

- **Widget Web** embebido en tu sitio con colores de marca
- **WhatsApp** para consultas fuera del horario laboral
- **Webhook** para integrar con tu CRM actual

¿Tienes alguna restricción técnica que deba considerar en la configuración?`,
}

// ── Markdown renderer ─────────────────────────────────────────────────────────

function MsgMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold text-[#0F2870]">{children}</strong>,
        ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2">{children}</ol>,
        li: ({ children }) => <li className="text-[#374151]">{children}</li>,
        code: ({ inline, children }: any) =>
          inline ? (
            <code className="px-1.5 py-0.5 rounded text-xs font-mono bg-[#F0F4FF] text-[#0F2870]">
              {children}
            </code>
          ) : (
            <pre className="my-2 p-3 rounded-xl bg-[#0F1629] text-[#94A3B8] text-xs font-mono overflow-x-auto leading-relaxed">
              <code>{children}</code>
            </pre>
          ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-[#D4009A] pl-3 italic text-[#6B7280] mb-2">
            {children}
          </blockquote>
        ),
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#D4009A] underline underline-offset-2 hover:opacity-80">
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AgentBuilderView() {
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVS)
  const [activeId, setActiveId] = useState<string>("c1")
  const [input, setInput] = useState("")
  const [isThinking, setIsThinking] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [search, setSearch] = useState("")
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [renameVal, setRenameVal] = useState("")
  const [responseIdx, setResponseIdx] = useState(0)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const activeConv = conversations.find((c) => c.id === activeId)!

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [activeConv?.messages, isThinking])

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = "auto"
    ta.style.height = Math.min(ta.scrollHeight, 180) + "px"
  }, [input])

  const handleNewConv = () => {
    const id = `c-${Date.now()}`
    const newConv: Conversation = {
      id,
      title: "Nueva conversación",
      updatedAt: "Ahora",
      messages: [{ ...WELCOME, id: `w-${id}` }],
    }
    setConversations((prev) => [newConv, ...prev])
    setActiveId(id)
    setInput("")
  }

  const handleSend = () => {
    const text = input.trim()
    if (!text || isThinking) return

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: text }
    setConversations((prev) =>
      prev.map((c) =>
        c.id !== activeId
          ? c
          : {
              ...c,
              title: c.messages.length <= 1 ? text.slice(0, 48) : c.title,
              updatedAt: "Ahora",
              messages: [...c.messages, userMsg],
            }
      )
    )
    setInput("")
    setIsThinking(true)

    // Simulate streaming response
    setTimeout(() => {
      const reply = KRNL_RESPONSES[responseIdx % Object.keys(KRNL_RESPONSES).length]
      setResponseIdx((i) => i + 1)
      const assistantMsg: Message = { id: `a-${Date.now()}`, role: "assistant", content: reply }
      setConversations((prev) =>
        prev.map((c) =>
          c.id !== activeId
            ? c
            : { ...c, messages: [...c.messages, assistantMsg] }
        )
      )
      setIsThinking(false)
    }, 1400)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleDelete = (id: string) => {
    const next = conversations.filter((c) => c.id !== id)
    setConversations(next)
    if (activeId === id) setActiveId(next[0]?.id ?? "")
    setMenuOpen(null)
  }

  const handleRename = (id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: renameVal.trim() || c.title } : c))
    )
    setRenaming(null)
  }

  return (
    <div className="flex h-full overflow-hidden" style={{ background: "#F8F9FC" }}>

      {/* ── Left sidebar ────────────────────────────────────────────────────── */}
      <aside
        className={cn(
          "flex flex-col shrink-0 transition-all duration-200 border-r border-[rgba(145,158,171,0.16)]",
          sidebarOpen ? "w-64" : "w-0 overflow-hidden"
        )}
        style={{ background: "#0F1629" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg,#D4009A,#5E24D5)" }}
            >
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">KRNL Agent</span>
          </div>
          <button
            onClick={handleNewConv}
            className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
            title="Nueva conversación"
          >
            <Plus className="h-4 w-4 text-white/60" />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 mb-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.06)" }}>
            <Search className="h-3.5 w-3.5 shrink-0" style={{ color: "rgba(255,255,255,0.3)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar conversaciones..."
              className="flex-1 bg-transparent text-xs outline-none placeholder:text-white/30 text-white/80"
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-4">
          {filtered.length === 0 && (
            <p className="text-xs text-white/30 text-center mt-6">Sin resultados</p>
          )}
          {filtered.map((conv) => (
            <div key={conv.id} className="relative group">
              {renaming === conv.id ? (
                <div className="flex items-center gap-1 px-2 py-1.5">
                  <input
                    autoFocus
                    value={renameVal}
                    onChange={(e) => setRenameVal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(conv.id)
                      if (e.key === "Escape") setRenaming(null)
                    }}
                    className="flex-1 bg-white/10 text-white text-xs px-2 py-1 rounded-lg outline-none"
                  />
                  <button onClick={() => handleRename(conv.id)} className="text-green-400 hover:text-green-300">
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setRenaming(null)} className="text-white/40 hover:text-white/60">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setActiveId(conv.id); setMenuOpen(null) }}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-xl transition-colors",
                    activeId === conv.id
                      ? "bg-white/12 text-white"
                      : "text-white/50 hover:bg-white/6 hover:text-white/80"
                  )}
                  style={activeId === conv.id ? { background: "rgba(255,255,255,0.1)" } : {}}
                >
                  <p className="text-xs font-medium truncate">{conv.title}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                    {conv.updatedAt}
                  </p>
                </button>
              )}

              {/* Context menu */}
              <div className={cn("absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5", renaming === conv.id ? "hidden" : "opacity-0 group-hover:opacity-100 transition-opacity")}>
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === conv.id ? null : conv.id) }}
                  className="h-6 w-6 rounded-lg flex items-center justify-center hover:bg-white/10 text-white/40 hover:text-white/70"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              </div>

              {menuOpen === conv.id && (
                <div
                  className="absolute right-1 top-8 z-50 rounded-xl border overflow-hidden shadow-xl py-1 min-w-[140px]"
                  style={{ background: "#1E2D4A", borderColor: "rgba(255,255,255,0.08)" }}
                >
                  <button
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-white/70 hover:bg-white/8 hover:text-white transition-colors"
                    onClick={() => { setRenameVal(conv.title); setRenaming(conv.id); setMenuOpen(null) }}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Renombrar
                  </button>
                  <button
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:bg-white/8 transition-colors"
                    onClick={() => handleDelete(conv.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Eliminar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="px-4 py-3 border-t flex items-center gap-2.5"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <div
            className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold text-white"
            style={{ background: "#D4009A" }}
          >
            UA
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white/80 truncate">Usuario Admin</p>
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>Mi Organización</p>
          </div>
        </div>
      </aside>

      {/* ── Main chat area ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <div
          className="flex items-center gap-3 px-5 py-3.5 border-b shrink-0"
          style={{ background: "#FFFFFF", borderColor: "rgba(145,158,171,0.16)" }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg transition-colors hover:bg-[#F4F6F8] text-[#637381]"
          >
            {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </button>

          <div className="h-4 w-px bg-[#E5E7EB]" />

          {/* KRNL Agent badge */}
          <div className="flex items-center gap-2">
            <div
              className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg,#D4009A,#5E24D5)" }}
            >
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#1C2434" }}>KRNL Agent</p>
              <p className="text-[11px]" style={{ color: "#637381" }}>Agent Builder</p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span
              className="text-[11px] font-medium px-2.5 py-1 rounded-full"
              style={{ background: "#F0FFF4", color: "#16A34A" }}
            >
              En línea
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6" onClick={() => setMenuOpen(null)}>
          {activeConv?.messages.length === 0 && !isThinking && (
            <EmptyState onSuggest={(s) => { setInput(s); textareaRef.current?.focus() }} />
          )}

          {activeConv?.messages.map((msg) => (
            <div
              key={msg.id}
              className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}
            >
              {/* Avatar */}
              {msg.role === "assistant" ? (
                <div
                  className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: "linear-gradient(135deg,#D4009A,#5E24D5)" }}
                >
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
              ) : (
                <div
                  className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold text-white"
                  style={{ background: "#0F2870" }}
                >
                  UA
                </div>
              )}

              {/* Bubble */}
              <div
                className={cn("max-w-[72%] rounded-2xl px-4 py-3 text-sm", msg.role === "user" ? "rounded-tr-sm" : "rounded-tl-sm")}
                style={
                  msg.role === "user"
                    ? { background: "#0F2870", color: "#FFFFFF" }
                    : { background: "#FFFFFF", color: "#1C2434", border: "1px solid rgba(145,158,171,0.16)" }
                }
              >
                {msg.role === "user" ? (
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <MsgMarkdown content={msg.content} />
                )}
              </div>
            </div>
          ))}

          {/* Thinking indicator */}
          {isThinking && (
            <div className="flex gap-3">
              <div
                className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg,#D4009A,#5E24D5)" }}
              >
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div
                className="rounded-2xl rounded-tl-sm px-4 py-3"
                style={{ background: "#FFFFFF", border: "1px solid rgba(145,158,171,0.16)" }}
              >
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-2 w-2 rounded-full"
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

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div
          className="px-6 py-4 border-t shrink-0"
          style={{ background: "#FFFFFF", borderColor: "rgba(145,158,171,0.16)" }}
        >
          <div
            className="flex items-end gap-3 rounded-2xl border px-4 py-3 transition-colors focus-within:border-[#D4009A]"
            style={{ borderColor: "rgba(145,158,171,0.24)", background: "#F8F9FC" }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu mensaje... (Enter para enviar, Shift+Enter para nueva línea)"
              rows={1}
              className="flex-1 bg-transparent text-sm outline-none resize-none text-[#1C2434] placeholder:text-[#9AA1B4] leading-relaxed"
              style={{ maxHeight: 180 }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isThinking}
              className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: input.trim() && !isThinking ? "#D4009A" : "#E5E7EB" }}
            >
              <Send className="h-3.5 w-3.5" style={{ color: input.trim() && !isThinking ? "#FFFFFF" : "#9CA3AF" }} />
            </button>
          </div>
          <p className="text-center text-[11px] mt-2" style={{ color: "#9AA1B4" }}>
            KRNL Agent puede cometer errores. Verifica información importante antes de publicar tu agente.
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ onSuggest }: { onSuggest: (s: string) => void }) {
  const suggestions = [
    "Crear un agente de atención al cliente",
    "Ayúdame a configurar un agente de ventas",
    "Quiero un bot para responder preguntas de RRHH",
    "Construir un agente que busque en mi CRM",
  ]
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div
        className="h-14 w-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "linear-gradient(135deg,#D4009A22,#5E24D522)", border: "1px solid #D4009A33" }}
      >
        <Sparkles className="h-7 w-7" style={{ color: "#D4009A" }} />
      </div>
      <h2 className="text-xl font-bold mb-1.5" style={{ color: "#1C2434" }}>
        ¿Qué agente quieres construir hoy?
      </h2>
      <p className="text-sm mb-8 max-w-sm" style={{ color: "#637381" }}>
        Cuéntame tu caso de uso y te ayudaré a configurar tu agente CORE paso a paso.
      </p>
      <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onSuggest(s)}
            className="text-left px-4 py-3 rounded-xl border text-sm transition-all hover:border-[#D4009A] hover:bg-[#FFF0FA]"
            style={{
              borderColor: "rgba(145,158,171,0.24)",
              background: "#FFFFFF",
              color: "#374151",
            }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
