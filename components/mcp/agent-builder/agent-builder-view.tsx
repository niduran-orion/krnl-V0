"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  Plus,
  Search,
  ArrowLeft,
  Send,
  Cpu,
  ChevronDown,
  Trash2,
  MoreHorizontal,
  Pencil,
  Bot,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ── Types ────────────────────────────────────────────────────────────────────

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

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: `Hola, soy **KRNL Agent** — tu asistente para construir agentes CORE.

Puedo ayudarte a:

- Definir el **objetivo y personalidad** de tu agente
- Configurar su **base de conocimiento** (fuentes, colecciones)
- Seleccionar **herramientas** y capacidades
- Ajustar los **parámetros del modelo** (temperatura, contexto, guardrails)
- Publicar y conectar tu agente a canales

¿Con qué tipo de agente quieres empezar?`,
}

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: "c1",
    title: "Agente de soporte técnico",
    updatedAt: "Hace 2 h",
    messages: [
      WELCOME_MESSAGE,
      { id: "u1", role: "user", content: "Quiero crear un agente de soporte técnico para mi empresa." },
      {
        id: "a1",
        role: "assistant",
        content: `Perfecto. Un agente de soporte técnico es uno de los casos de uso más potentes de KRNL.

Para empezar, necesito entender el contexto:

1. **¿Qué producto o servicio** soportará el agente?
2. **¿Cuál es el canal principal?** (chat web, WhatsApp, Slack, etc.)
3. **¿Tienes documentación existente?** (manuales, FAQs, tickets resueltos)

Con esta información podré sugerirte la arquitectura ideal.`,
      },
    ],
  },
  {
    id: "c2",
    title: "Asistente de onboarding RRHH",
    updatedAt: "Ayer",
    messages: [WELCOME_MESSAGE],
  },
  {
    id: "c3",
    title: "Bot de ventas e-commerce",
    updatedAt: "2 abr",
    messages: [WELCOME_MESSAGE],
  },
]

const SUGGESTED_PROMPTS = [
  { label: "Agente de soporte", description: "Responde tickets y consultas técnicas" },
  { label: "Asistente de ventas", description: "Califica leads y responde preguntas de producto" },
  { label: "Bot de RRHH", description: "Onboarding, políticas y consultas internas" },
  { label: "Agente de conocimiento", description: "Busca en documentos y bases de datos" },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatId() {
  return Math.random().toString(36).slice(2, 10)
}

function buildAssistantReply(userText: string): string {
  const lower = userText.toLowerCase()
  if (lower.includes("nombre") || lower.includes("llamar") || lower.includes("llama"))
    return `Buen nombre. Ahora cuéntame: **¿cuál es el objetivo principal** de este agente? ¿Qué problema resuelve para tus usuarios?`
  if (lower.includes("objetivo") || lower.includes("propósito") || lower.includes("para qué"))
    return `Claro. Con ese objetivo en mente, ¿el agente necesitará acceder a **documentos o bases de conocimiento** existentes, o partirá desde cero?`
  if (lower.includes("documento") || lower.includes("conocimiento") || lower.includes("fuente"))
    return `Perfecto. Puedo conectar colecciones de documentos PDF, URLs, o bases de datos directamente.\n\n¿Qué **herramientas externas** necesitará el agente? (ej: enviar emails, buscar en CRM, crear tickets)`
  if (lower.includes("herramienta") || lower.includes("crm") || lower.includes("email") || lower.includes("ticket"))
    return `Excelente configuración. Finalmente, ¿en qué **canales** publicarás este agente?\n\n- Widget web (iframe)\n- WhatsApp / Telegram\n- Slack / Teams\n- API directa`
  if (lower.includes("canal") || lower.includes("whatsapp") || lower.includes("web") || lower.includes("slack"))
    return `Todo listo. Basándome en lo que me contaste, voy a generar la configuración inicial de tu agente CORE.\n\n**Resumen de tu agente:**\n- Objetivo definido\n- Base de conocimiento conectada\n- Herramientas configuradas\n- Canal de publicación seleccionado\n\n¿Quieres que lo cree ahora o ajustamos algo antes?`
  return `Entendido. Para continuar configurando tu agente, ¿podrías darme más detalles sobre ese punto? Mientras más contexto tengas, mejor podré ajustar los parámetros del modelo y las capacidades del agente.`
}

// ── Markdown renderer ─────────────────────────────────────────────────────────

function MdContent({ content, light = false }: { content: string; light?: boolean }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        ul: ({ children }) => <ul className="list-disc list-outside ml-4 space-y-1 mb-2">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-outside ml-4 space-y-1 mb-2">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        code: ({ children }) => (
          <code
            className={cn(
              "px-1.5 py-0.5 rounded text-xs font-mono",
              light ? "bg-white/10 text-white" : "bg-slate-100 text-[#0F2870]"
            )}
          >
            {children}
          </code>
        ),
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 opacity-80 hover:opacity-100">
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
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS)
  const [activeId, setActiveId] = useState<string>(INITIAL_CONVERSATIONS[0].id)
  const [input, setInput] = useState("")
  const [isThinking, setIsThinking] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const activeConv = conversations.find((c) => c.id === activeId)!

  const filteredConvs = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [activeConv?.messages.length, isThinking])

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 180) + "px"
  }, [input])

  const handleNewChat = () => {
    const id = formatId()
    const newConv: Conversation = {
      id,
      title: "Nueva conversación",
      updatedAt: "Ahora",
      messages: [{ ...WELCOME_MESSAGE, id: formatId() }],
    }
    setConversations((prev) => [newConv, ...prev])
    setActiveId(id)
    setInput("")
  }

  const handleSend = () => {
    const text = input.trim()
    if (!text || isThinking) return

    const userMsg: Message = { id: formatId(), role: "user", content: text }
    setInput("")
    setIsThinking(true)

    setConversations((prev) =>
      prev.map((c) =>
        c.id !== activeId
          ? c
          : {
              ...c,
              title: c.messages.length === 1 ? text.slice(0, 48) : c.title,
              updatedAt: "Ahora",
              messages: [...c.messages, userMsg],
            }
      )
    )

    // Simulate streaming delay
    setTimeout(() => {
      const reply: Message = {
        id: formatId(),
        role: "assistant",
        content: buildAssistantReply(text),
      }
      setConversations((prev) =>
        prev.map((c) =>
          c.id !== activeId ? c : { ...c, messages: [...c.messages, reply] }
        )
      )
      setIsThinking(false)
    }, 1400 + Math.random() * 600)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleDelete = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id))
    if (activeId === id && conversations.length > 1) {
      setActiveId(conversations.find((c) => c.id !== id)!.id)
    }
    setMenuOpenId(null)
  }

  const handleRenameStart = (conv: Conversation) => {
    setEditingId(conv.id)
    setEditTitle(conv.title)
    setMenuOpenId(null)
  }

  const handleRenameConfirm = () => {
    if (!editTitle.trim()) return
    setConversations((prev) =>
      prev.map((c) => (c.id === editingId ? { ...c, title: editTitle.trim() } : c))
    )
    setEditingId(null)
  }

  const handleSuggestedPrompt = (label: string) => {
    setInput(`Quiero crear un agente de ${label.toLowerCase()}`)
    textareaRef.current?.focus()
  }

  const isEmpty = activeConv.messages.length === 1 && activeConv.messages[0].role === "assistant"

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: "#0B1120" }}>

      {/* ── Left Sidebar ────────────────────────────────────────────────────── */}
      <aside
        className={cn(
          "flex flex-col h-full shrink-0 transition-all duration-300 overflow-hidden border-r",
          sidebarOpen ? "w-64" : "w-0"
        )}
        style={{ borderColor: "rgba(255,255,255,0.06)", background: "#0F1629" }}
      >
        {/* Logo + collapse */}
        <div className="flex items-center justify-between px-4 pt-5 pb-4 shrink-0">
          <Link href="/" className="flex items-center gap-2 group">
            <div
              className="h-7 w-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #D4009A, #5E24D5)" }}
            >
              <Cpu className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-none">KRNL</p>
              <p className="text-[10px] leading-none mt-0.5" style={{ color: "#5E24D5" }}>Agent Builder</p>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "rgba(255,255,255,0.35)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>

        {/* New chat button */}
        <div className="px-3 mb-3 shrink-0">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ background: "rgba(212,0,154,0.15)", color: "#F472B6" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(212,0,154,0.25)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(212,0,154,0.15)"
            }}
          >
            <Plus className="h-4 w-4" />
            Nueva conversación
          </button>
        </div>

        {/* Search */}
        <div className="px-3 mb-3 shrink-0">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.05)" }}>
            <Search className="h-3.5 w-3.5 shrink-0" style={{ color: "rgba(255,255,255,0.3)" }} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar conversaciones..."
              className="bg-transparent text-xs outline-none w-full placeholder:opacity-40"
              style={{ color: "rgba(255,255,255,0.75)" }}
            />
          </div>
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-4">
          {filteredConvs.length === 0 && (
            <p className="text-center text-xs py-6" style={{ color: "rgba(255,255,255,0.25)" }}>
              Sin resultados
            </p>
          )}
          {filteredConvs.map((conv) => {
            const isActive = conv.id === activeId
            return (
              <div key={conv.id} className="relative group">
                {editingId === conv.id ? (
                  <div className="px-2 py-1">
                    <input
                      autoFocus
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={handleRenameConfirm}
                      onKeyDown={(e) => e.key === "Enter" && handleRenameConfirm()}
                      className="w-full text-xs rounded-lg px-2 py-1.5 outline-none"
                      style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(212,0,154,0.5)" }}
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveId(conv.id)}
                    className="w-full text-left px-3 py-2.5 rounded-xl transition-all relative"
                    style={
                      isActive
                        ? { background: "rgba(255,255,255,0.09)", color: "#fff" }
                        : { color: "rgba(255,255,255,0.55)" }
                    }
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.05)"
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = ""
                    }}
                  >
                    <p className="text-xs font-medium truncate pr-6">{conv.title}</p>
                    <p className="text-[10px] mt-0.5 opacity-40">{conv.updatedAt}</p>

                    {/* Three-dot menu */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setMenuOpenId(menuOpenId === conv.id ? null : conv.id)
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: "rgba(255,255,255,0.5)" }}
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                  </button>
                )}

                {/* Dropdown menu */}
                {menuOpenId === conv.id && (
                  <div
                    className="absolute right-2 top-10 z-50 rounded-xl shadow-2xl py-1 w-36"
                    style={{ background: "#1B2845", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    <button
                      onClick={() => handleRenameStart(conv)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors"
                      style={{ color: "rgba(255,255,255,0.7)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Renombrar
                    </button>
                    <button
                      onClick={() => handleDelete(conv.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors"
                      style={{ color: "#F87171" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(248,113,113,0.1)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Back to KRNL */}
        <div className="px-3 py-3 shrink-0 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <Link
            href="/agente/conocimiento"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-colors"
            style={{ color: "rgba(255,255,255,0.4)" }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.color = "rgba(255,255,255,0.7)"
              el.style.background = "rgba(255,255,255,0.05)"
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.color = "rgba(255,255,255,0.4)"
              el.style.background = ""
            }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver a KRNL
          </Link>
        </div>
      </aside>

      {/* ── Main chat area ───────────────────────────────────────────────────── */}
      <main className="flex flex-col flex-1 h-full overflow-hidden">

        {/* Topbar */}
        <header
          className="flex items-center gap-3 px-5 py-3.5 shrink-0 border-b"
          style={{ background: "#0B1120", borderColor: "rgba(255,255,255,0.06)" }}
        >
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg transition-colors mr-1"
              style={{ color: "rgba(255,255,255,0.4)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          )}

          {/* KRNL Agent identity */}
          <div className="flex items-center gap-2.5">
            <div
              className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #D4009A 0%, #5E24D5 100%)" }}
            >
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-none">KRNL Agent</p>
              <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                Asistente de construccion de agentes CORE
              </p>
            </div>
          </div>

          {/* Status dot */}
          <div className="ml-auto flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>En linea</span>
          </div>
        </header>

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-16 xl:px-32 py-8 space-y-6"
          style={{ background: "#0D1527" }}
          onClick={() => setMenuOpenId(null)}
        >
          {/* Empty state with suggestions */}
          {isEmpty && (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
              <div
                className="h-16 w-16 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: "linear-gradient(135deg, rgba(212,0,154,0.2), rgba(94,36,213,0.2))", border: "1px solid rgba(212,0,154,0.2)" }}
              >
                <Bot className="h-8 w-8" style={{ color: "#D4009A" }} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 text-balance">
                Construye tu agente CORE
              </h2>
              <p className="text-sm mb-8 max-w-md text-balance" style={{ color: "rgba(255,255,255,0.45)" }}>
                Descríbeme el agente que necesitas y te ayudaré a configurarlo paso a paso.
              </p>

              {/* Suggested prompts */}
              <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
                {SUGGESTED_PROMPTS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => handleSuggestedPrompt(p.label)}
                    className="text-left p-4 rounded-xl border transition-all"
                    style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLElement
                      el.style.background = "rgba(212,0,154,0.07)"
                      el.style.borderColor = "rgba(212,0,154,0.25)"
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement
                      el.style.background = "rgba(255,255,255,0.03)"
                      el.style.borderColor = "rgba(255,255,255,0.08)"
                    }}
                  >
                    <p className="text-sm font-semibold text-white mb-1">{p.label}</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{p.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message list */}
          {activeConv.messages.map((msg) => {
            const isAssistant = msg.role === "assistant"
            return (
              <div
                key={msg.id}
                className={cn("flex gap-3 max-w-3xl", isAssistant ? "mr-auto" : "ml-auto flex-row-reverse")}
              >
                {/* Avatar */}
                {isAssistant && (
                  <div
                    className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: "linear-gradient(135deg, #D4009A, #5E24D5)" }}
                  >
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                )}

                {/* Bubble */}
                <div
                  className={cn("rounded-2xl px-4 py-3 text-sm", isAssistant ? "rounded-tl-sm" : "rounded-tr-sm")}
                  style={
                    isAssistant
                      ? { background: "#1A2640", color: "rgba(255,255,255,0.88)" }
                      : { background: "linear-gradient(135deg, #D4009A, #5E24D5)", color: "#fff" }
                  }
                >
                  <MdContent content={msg.content} light={!isAssistant} />
                </div>
              </div>
            )
          })}

          {/* Thinking indicator */}
          {isThinking && (
            <div className="flex gap-3 max-w-3xl mr-auto">
              <div
                className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, #D4009A, #5E24D5)" }}
              >
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div
                className="rounded-2xl rounded-tl-sm px-4 py-3.5 flex items-center gap-1.5"
                style={{ background: "#1A2640" }}
              >
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-2 w-2 rounded-full"
                    style={{
                      background: "#D4009A",
                      animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                      opacity: 0.8,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div
          className="px-4 md:px-8 lg:px-16 xl:px-32 py-4 shrink-0"
          style={{ background: "#0D1527", borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div
            className="flex items-end gap-3 rounded-2xl px-4 py-3"
            style={{ background: "#1A2640", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe el agente que quieres construir..."
              rows={1}
              className="flex-1 bg-transparent text-sm resize-none outline-none leading-relaxed py-0.5"
              style={{
                color: "rgba(255,255,255,0.85)",
                maxHeight: "180px",
                scrollbarWidth: "none",
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isThinking}
              className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-all"
              style={
                input.trim() && !isThinking
                  ? { background: "linear-gradient(135deg, #D4009A, #5E24D5)", color: "#fff" }
                  : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.25)" }
              }
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="text-center text-[10px] mt-2" style={{ color: "rgba(255,255,255,0.2)" }}>
            Presiona Enter para enviar · Shift+Enter para nueva linea
          </p>
        </div>
      </main>
    </div>
  )
}
