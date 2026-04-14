"use client"

import { useState, useRef, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Send, Sparkles, RotateCcw, ChevronDown, Check } from "lucide-react"

// ── Providers & Models ────────────────────────────────────────────────────────

type Model = { id: string; name: string; context: string }
type Provider = { id: string; name: string; logo: string; color: string; models: Model[] }

const PROVIDERS: Provider[] = [
  {
    id: "openai",
    name: "OpenAI",
    logo: "OA",
    color: "#10A37F",
    models: [
      { id: "gpt-4o", name: "GPT-4o", context: "128k" },
      { id: "gpt-4o-mini", name: "GPT-4o mini", context: "128k" },
      { id: "gpt-4-turbo", name: "GPT-4 Turbo", context: "128k" },
      { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", context: "16k" },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    logo: "AN",
    color: "#C96442",
    models: [
      { id: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet", context: "200k" },
      { id: "claude-3-5-haiku", name: "Claude 3.5 Haiku", context: "200k" },
      { id: "claude-3-opus", name: "Claude 3 Opus", context: "200k" },
    ],
  },
  {
    id: "mistral",
    name: "Mistral",
    logo: "MI",
    color: "#F7931A",
    models: [
      { id: "mistral-large", name: "Mistral Large", context: "128k" },
      { id: "mistral-medium", name: "Mistral Medium", context: "32k" },
      { id: "mistral-small", name: "Mistral Small", context: "32k" },
    ],
  },
  {
    id: "groq",
    name: "Groq",
    logo: "GQ",
    color: "#F55036",
    models: [
      { id: "llama-3.1-70b", name: "Llama 3.1 70B", context: "128k" },
      { id: "llama-3.1-8b", name: "Llama 3.1 8B", context: "128k" },
      { id: "mixtral-8x7b", name: "Mixtral 8x7B", context: "32k" },
    ],
  },
]

// ── Types ─────────────────────────────────────────────────────────────────────

type Role = "user" | "assistant"

interface Message {
  id: string
  role: Role
  content: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

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

const SUGGESTIONS = [
  "Crear un agente de atención al cliente",
  "Ayúdame a configurar un agente de ventas",
  "Quiero un bot para responder preguntas de RRHH",
  "Construir un agente que busque en mi CRM",
]

const KRNL_RESPONSES = [
  `Entendido. Para construir ese agente necesito definir tres pilares:

**1. Objetivo**
¿Cuál es la tarea principal del agente? (responder preguntas, ejecutar acciones, calificar leads, etc.)

**2. Conocimiento**
¿Qué información debe conocer? (documentos, base de datos, APIs externas)

**3. Herramientas**
¿Necesita hacer algo además de responder? (enviar emails, crear tickets, buscar en CRM)

Cuéntame más sobre tu caso de uso y te armo la configuración.`,
  `Perfecto. Basándome en lo que me comentas, te sugiero esta arquitectura:

\`\`\`
Agente Principal
├── Guardrail: Llama Guard 3
├── Colección: docs-cliente
├── Herramientas: Buscar CRM, Crear ticket
└── Modelo: GPT-4o mini (temperatura: 0.3)
\`\`\`

¿Quieres que empecemos configurando el **Objetivo** o prefieres subir los documentos primero?`,
  `Excelente elección. Para el canal que mencionas te recomiendo:

- **Widget Web** embebido en tu sitio con colores de marca
- **WhatsApp** para consultas fuera del horario laboral
- **Webhook** para integrar con tu CRM actual

¿Tienes alguna restricción técnica que deba considerar en la configuración?`,
  `Listo. Con la información que me diste puedo generar el borrador del agente. Esto incluye:

1. **Nombre y descripción** del agente
2. **Prompt de sistema** con el rol y restricciones
3. **Colecciones** sugeridas para el conocimiento
4. **Guardrail** recomendado según el dominio

¿Quieres que lo genere ahora o prefieres ajustar algún parámetro antes?`,
]

// ── Markdown renderer ─────────────────────────────────────────────────────────

function MsgMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
        strong: ({ children }) => (
          <strong className="font-semibold" style={{ color: "#0F2870" }}>
            {children}
          </strong>
        ),
        ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2">{children}</ol>,
        li: ({ children }) => <li style={{ color: "#374151" }}>{children}</li>,
        code: ({ inline, children }: any) =>
          inline ? (
            <code
              className="px-1.5 py-0.5 rounded text-xs font-mono"
              style={{ background: "#EEF2FF", color: "#0F2870" }}
            >
              {children}
            </code>
          ) : (
            <pre
              className="my-2 p-3 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed"
              style={{ background: "#0F1629", color: "#94A3B8" }}
            >
              <code>{children}</code>
            </pre>
          ),
        blockquote: ({ children }) => (
          <blockquote
            className="border-l-2 pl-3 italic mb-2"
            style={{ borderColor: "#D4009A", color: "#6B7280" }}
          >
            {children}
          </blockquote>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:opacity-80"
            style={{ color: "#D4009A" }}
          >
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
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input, setInput] = useState("")
  const [isThinking, setIsThinking] = useState(false)
  const [responseIdx, setResponseIdx] = useState(0)

  const [selectedProvider, setSelectedProvider] = useState<Provider>(PROVIDERS[0])
  const [selectedModel, setSelectedModel] = useState<Model>(PROVIDERS[0].models[0])
  const [providerOpen, setProviderOpen] = useState(false)
  const [modelOpen, setModelOpen] = useState(false)

  const providerRef = useRef<HTMLDivElement>(null)
  const modelRef = useRef<HTMLDivElement>(null)

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (providerRef.current && !providerRef.current.contains(e.target as Node)) setProviderOpen(false)
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) setModelOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleSelectProvider = (p: Provider) => {
    setSelectedProvider(p)
    setSelectedModel(p.models[0])
    setProviderOpen(false)
  }

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isThinking])

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = "auto"
    ta.style.height = Math.min(ta.scrollHeight, 180) + "px"
  }, [input])

  const handleSend = (text?: string) => {
    const content = (text ?? input).trim()
    if (!content || isThinking) return

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setIsThinking(true)

    setTimeout(() => {
      const reply = KRNL_RESPONSES[responseIdx % KRNL_RESPONSES.length]
      setResponseIdx((i) => i + 1)
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: "assistant", content: reply }])
      setIsThinking(false)
    }, 1400)
  }

  const handleReset = () => {
    setMessages([{ ...WELCOME, id: `w-${Date.now()}` }])
    setInput("")
    setResponseIdx(0)
    setIsThinking(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isEmpty = messages.length === 1 && messages[0].role === "assistant"

  return (
    <div className="flex flex-col h-full" style={{ background: "#F8F9FC" }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-6 py-3.5 border-b shrink-0"
        style={{ background: "#FFFFFF", borderColor: "rgba(145,158,171,0.16)" }}
      >
        <div
          className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg,#D4009A,#5E24D5)" }}
        >
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: "#1C2434" }}>
            KRNL Agent
          </p>
          <p className="text-[11px]" style={{ color: "#637381" }}>
            Agent Builder — construye tu agente CORE
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2">

          {/* Provider selector */}
          <div ref={providerRef} className="relative">
            <button
              onClick={() => { setProviderOpen((o) => !o); setModelOpen(false) }}
              className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all"
              style={{
                background: "#FFFFFF",
                borderColor: "rgba(145,158,171,0.24)",
                color: "#1C2434",
              }}
            >
              <span
                className="h-4.5 w-4.5 rounded text-[9px] font-bold text-white px-1 py-0.5 shrink-0"
                style={{ background: selectedProvider.color, fontSize: "9px" }}
              >
                {selectedProvider.logo}
              </span>
              {selectedProvider.name}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </button>
            {providerOpen && (
              <div
                className="absolute right-0 top-full mt-1.5 w-44 rounded-xl border shadow-lg py-1 z-50"
                style={{ background: "#FFFFFF", borderColor: "rgba(145,158,171,0.16)" }}
              >
                {PROVIDERS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectProvider(p)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors hover:bg-slate-50"
                    style={{ color: "#1C2434" }}
                  >
                    <span
                      className="h-5 w-5 rounded text-white flex items-center justify-center font-bold shrink-0"
                      style={{ background: p.color, fontSize: "9px" }}
                    >
                      {p.logo}
                    </span>
                    <span className="flex-1 text-left font-medium">{p.name}</span>
                    {selectedProvider.id === p.id && (
                      <Check className="h-3 w-3" style={{ color: "#D4009A" }} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Model selector */}
          <div ref={modelRef} className="relative">
            <button
              onClick={() => { setModelOpen((o) => !o); setProviderOpen(false) }}
              className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all"
              style={{
                background: "#FFFFFF",
                borderColor: "rgba(145,158,171,0.24)",
                color: "#1C2434",
              }}
            >
              <span className="max-w-[120px] truncate">{selectedModel.name}</span>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-mono"
                style={{ background: "#EEF2FF", color: "#5E24D5" }}
              >
                {selectedModel.context}
              </span>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </button>
            {modelOpen && (
              <div
                className="absolute right-0 top-full mt-1.5 w-52 rounded-xl border shadow-lg py-1 z-50"
                style={{ background: "#FFFFFF", borderColor: "rgba(145,158,171,0.16)" }}
              >
                {selectedProvider.models.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => { setSelectedModel(m); setModelOpen(false) }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors hover:bg-slate-50"
                    style={{ color: "#1C2434" }}
                  >
                    <span className="flex-1 text-left font-medium">{m.name}</span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-mono shrink-0"
                      style={{ background: "#F1F5F9", color: "#637381" }}
                    >
                      {m.context}
                    </span>
                    {selectedModel.id === m.id && (
                      <Check className="h-3 w-3 shrink-0" style={{ color: "#D4009A" }} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-5 mx-1" style={{ background: "rgba(145,158,171,0.2)" }} />

          <span
            className="text-[11px] font-medium px-2.5 py-1 rounded-full"
            style={{ background: "#F0FFF4", color: "#16A34A" }}
          >
            En línea
          </span>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{ background: "#F4F6F8", color: "#637381" }}
            title="Nueva sesión"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Nueva sesión
          </button>
        </div>
      </div>

      {/* ── Messages ────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
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
                  className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold text-white"
                  style={{ background: "#0F2870" }}
                >
                  UA
                </div>
              )}

              {/* Bubble */}
              <div
                className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === "user" ? "rounded-tr-sm" : "rounded-tl-sm"
                }`}
                style={
                  msg.role === "user"
                    ? { background: "#0F2870", color: "#FFFFFF" }
                    : {
                        background: "#FFFFFF",
                        color: "#1C2434",
                        border: "1px solid rgba(145,158,171,0.16)",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                      }
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
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(145,158,171,0.16)",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                }}
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

          {/* Suggestion chips — shown only on welcome state */}
          {isEmpty && !isThinking && (
            <div className="flex flex-wrap gap-2 mt-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="text-xs px-3.5 py-2 rounded-full border transition-all hover:shadow-sm"
                  style={{
                    background: "#FFFFFF",
                    borderColor: "rgba(145,158,171,0.24)",
                    color: "#1C2434",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#D4009A"
                    e.currentTarget.style.color = "#D4009A"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(145,158,171,0.24)"
                    e.currentTarget.style.color = "#1C2434"
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Input area ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 border-t px-4 py-4" style={{ background: "#FFFFFF", borderColor: "rgba(145,158,171,0.16)" }}>
        <div className="max-w-3xl mx-auto">
          <div
            className="flex items-end gap-3 rounded-2xl border px-4 py-3 transition-all focus-within:shadow-sm"
            style={{
              background: "#F8F9FC",
              borderColor: "rgba(145,158,171,0.24)",
            }}
            onFocus={() => {}}
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe el agente que quieres construir..."
              className="flex-1 bg-transparent text-sm outline-none resize-none leading-relaxed placeholder:text-[#9AA3B0]"
              style={{ color: "#1C2434", minHeight: "24px", maxHeight: "180px" }}
              disabled={isThinking}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isThinking}
              className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 transition-all"
              style={
                input.trim() && !isThinking
                  ? { background: "#D4009A", color: "#FFFFFF" }
                  : { background: "#E5E7EB", color: "#9CA3AF" }
              }
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-center mt-2" style={{ color: "#9AA3B0" }}>
            Presiona Enter para enviar · Shift+Enter para nueva línea
          </p>
        </div>
      </div>
    </div>
  )
}
