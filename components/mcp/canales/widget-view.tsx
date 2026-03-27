"use client"

import { useState } from "react"
import { Copy, Check, Monitor, ChevronLeft, ChevronRight } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

const AGENTS = [
  { id: "ag-001", name: "Agente Comercial" },
  { id: "ag-002", name: "Soporte Técnico" },
  { id: "ag-003", name: "Asistente General" },
]

// Sample conversation to showcase markdown rendering
const SAMPLE_MESSAGES = [
  {
    role: "user" as const,
    text: "¿Qué planes tienen disponibles?",
  },
  {
    role: "agent" as const,
    text: `Tenemos **3 planes** disponibles:\n\n- **Starter** — hasta 1.000 consultas/mes\n- **Pro** — hasta 10.000 consultas/mes\n- **Enterprise** — ilimitado\n\n> Todos incluyen soporte 24/7.`,
  },
  {
    role: "user" as const,
    text: "¿El Pro incluye acceso a la API?",
  },
  {
    role: "agent" as const,
    text: `Sí, el plan **Pro** incluye:\n\n1. Acceso completo a la \`REST API\`\n2. Webhooks configurables\n3. Documentación en [docs.krnl.ai](https://docs.krnl.ai)\n\n¿Te gustaría comenzar una prueba gratuita?`,
  },
]

function MarkdownBubble({
  text,
  textColor,
  bubbleColor,
  isAgent,
}: {
  text: string
  textColor: string
  bubbleColor?: string
  isAgent: boolean
}) {
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs max-w-[200px] leading-relaxed"
      style={
        isAgent
          ? { background: bubbleColor, color: textColor, borderRadius: "0 12px 12px 12px" }
          : { background: "#F1F5F9", color: "#334155", borderRadius: "12px 0 12px 12px" }
      }
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => <ul className="list-disc list-inside space-y-0.5 mb-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside space-y-0.5 mb-1">{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          code: ({ children }) => (
            <code
              className="px-1 py-0.5 rounded text-[10px] font-mono"
              style={isAgent ? { background: "rgba(255,255,255,0.2)" } : { background: "#E2E8F0" }}
            >
              {children}
            </code>
          ),
          blockquote: ({ children }) => (
            <blockquote
              className="border-l-2 pl-2 italic opacity-80"
              style={isAgent ? { borderColor: "rgba(255,255,255,0.4)" } : { borderColor: "#CBD5E1" }}
            >
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 opacity-90 hover:opacity-100"
            >
              {children}
            </a>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}

export function WidgetView() {
  const [agentId, setAgentId] = useState(AGENTS[0].id)
  const [brandColor, setBrandColor] = useState("#D4009A")
  const [bubbleColor, setBubbleColor] = useState("#5E24D5")
  const [welcomeMsg, setWelcomeMsg] = useState("Hola, ¿en qué puedo ayudarte?")
  const [placeholder, setPlaceholder] = useState("Escribe un mensaje...")
  const [position, setPosition] = useState<"right" | "left">("right")
  const [chatOpen, setChatOpen] = useState(true)
  const [copied, setCopied] = useState(false)

  const selectedAgent = AGENTS.find((a) => a.id === agentId)!

  const iframeCode = `<iframe
  src="https://widget.krnl.ai/chat?agent=${agentId}&brand=${encodeURIComponent(brandColor)}&bubble=${encodeURIComponent(bubbleColor)}&welcome=${encodeURIComponent(welcomeMsg)}&position=${position}"
  style="position:fixed;${position}:24px;bottom:24px;width:380px;height:600px;border:none;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.18);z-index:9999;"
  allow="microphone"
  title="KRNL Chat Widget - ${selectedAgent.name}"
></iframe>`

  const handleCopy = () => {
    navigator.clipboard.writeText(iframeCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-1.5">
          <Monitor className="h-5 w-5 text-[#1B3A6E]" />
          <h1 className="text-xl font-semibold text-[#1B2A3B]">Widget Web</h1>
        </div>
        <p className="text-sm text-slate-500">
          Configura y genera el código para embeber el chat de tu agente en cualquier sitio web.
        </p>
      </div>

      <div className="flex gap-6">
        {/* ── Left panel: config ─────────────────────────────── */}
        <div className="w-[340px] shrink-0 flex flex-col gap-4">

          {/* Agent selector */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Agente
            </p>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Seleccionar agente
            </label>
            <select
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#D4009A] transition-colors"
            >
              {AGENTS.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          {/* Visual config */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
              Personalización visual
            </p>

            {/* Brand color */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Color de marca <span className="text-xs text-slate-400">(botón / cabecera)</span>
              </label>
              <div className="flex items-center gap-3">
                <div className="relative h-9 w-9 shrink-0">
                  <div
                    className="h-9 w-9 rounded-lg border border-slate-200 cursor-pointer shadow-sm"
                    style={{ background: brandColor }}
                  />
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </div>
                <input
                  type="text"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono text-slate-800 outline-none focus:border-[#D4009A] uppercase transition-colors"
                  maxLength={7}
                />
              </div>
            </div>

            {/* Bubble color */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Color de burbuja de chat
              </label>
              <div className="flex items-center gap-3">
                <div className="relative h-9 w-9 shrink-0">
                  <div
                    className="h-9 w-9 rounded-lg border border-slate-200 cursor-pointer shadow-sm"
                    style={{ background: bubbleColor }}
                  />
                  <input
                    type="color"
                    value={bubbleColor}
                    onChange={(e) => setBubbleColor(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </div>
                <input
                  type="text"
                  value={bubbleColor}
                  onChange={(e) => setBubbleColor(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono text-slate-800 outline-none focus:border-[#D4009A] uppercase transition-colors"
                  maxLength={7}
                />
              </div>
            </div>
          </div>

          {/* Texts */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
              Textos
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Mensaje de bienvenida
              </label>
              <input
                type="text"
                value={welcomeMsg}
                onChange={(e) => setWelcomeMsg(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#D4009A] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Placeholder del chat
              </label>
              <input
                type="text"
                value={placeholder}
                onChange={(e) => setPlaceholder(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#D4009A] transition-colors"
              />
            </div>
          </div>

          {/* Position toggle */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Posición
            </p>
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              <button
                onClick={() => setPosition("left")}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors"
                style={
                  position === "left"
                    ? { background: "#0F2870", color: "#FFFFFF" }
                    : { background: "#F8FAFC", color: "#475569" }
                }
              >
                <ChevronLeft className="h-4 w-4" />
                Izquierda
              </button>
              <button
                onClick={() => setPosition("right")}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors"
                style={
                  position === "right"
                    ? { background: "#0F2870", color: "#FFFFFF" }
                    : { background: "#F8FAFC", color: "#475569" }
                }
              >
                Derecha
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Right panel: preview ────────────────────────────── */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 flex-1 flex flex-col min-h-[480px]">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
              Vista previa en tiempo real
            </p>

            {/* Simulated browser */}
            <div
              className="flex-1 relative rounded-xl overflow-hidden border border-slate-200"
              style={{ background: "#F0F4F8", minHeight: 420 }}
            >
              {/* Fake browser bar */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-200 bg-white">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-amber-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-2 bg-slate-100 rounded-md px-3 py-1 text-xs text-slate-400 font-mono">
                  https://tu-sitio-web.com
                </div>
              </div>

              {/* Page content placeholder */}
              <div className="p-6 space-y-3">
                <div className="h-4 bg-slate-200 rounded-full w-2/3" />
                <div className="h-3 bg-slate-200 rounded-full w-full" />
                <div className="h-3 bg-slate-200 rounded-full w-5/6" />
                <div className="h-3 bg-slate-200 rounded-full w-4/6" />
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="h-20 bg-slate-200 rounded-lg" />
                  <div className="h-20 bg-slate-200 rounded-lg" />
                  <div className="h-20 bg-slate-200 rounded-lg" />
                </div>
              </div>

              {/* Floating widget button */}
              <div
                className={`absolute bottom-5 ${position === "right" ? "right-5" : "left-5"} flex flex-col items-${position === "right" ? "end" : "start"} gap-3`}
              >
                {/* Chat window */}
                {chatOpen && (
                  <div
                    className="w-72 rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
                    style={{ background: "#FFFFFF" }}
                  >
                    {/* Header */}
                    <div
                      className="px-4 py-3 flex items-center justify-between"
                      style={{ background: brandColor }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center">
                          <Monitor className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-white">{selectedAgent.name}</span>
                      </div>
                      <button
                        onClick={() => setChatOpen(false)}
                        className="text-white/70 hover:text-white text-lg leading-none"
                      >
                        ×
                      </button>
                    </div>
                    {/* Messages */}
                    <div className="px-4 py-3 space-y-2.5 overflow-y-auto" style={{ maxHeight: 280 }}>
                      {/* Welcome message */}
                      <div className="flex gap-2 items-start">
                        <div
                          className="h-6 w-6 rounded-full shrink-0 flex items-center justify-center"
                          style={{ background: brandColor }}
                        >
                          <Monitor className="h-3 w-3 text-white" />
                        </div>
                        <MarkdownBubble
                          text={welcomeMsg}
                          textColor="#ffffff"
                          bubbleColor={bubbleColor}
                          isAgent={true}
                        />
                      </div>

                      {/* Sample conversation */}
                      {SAMPLE_MESSAGES.map((msg, i) => (
                        <div
                          key={i}
                          className={`flex gap-2 items-start ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                        >
                          {msg.role === "agent" && (
                            <div
                              className="h-6 w-6 rounded-full shrink-0 flex items-center justify-center"
                              style={{ background: brandColor }}
                            >
                              <Monitor className="h-3 w-3 text-white" />
                            </div>
                          )}
                          <MarkdownBubble
                            text={msg.text}
                            textColor="#ffffff"
                            bubbleColor={bubbleColor}
                            isAgent={msg.role === "agent"}
                          />
                        </div>
                      ))}
                    </div>
                    {/* Input */}
                    <div className="px-3 pb-3">
                      <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
                        <span className="flex-1 text-xs text-slate-400">{placeholder}</span>
                        <div
                          className="h-6 w-6 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: brandColor }}
                        >
                          <ChevronRight className="h-3.5 w-3.5 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* FAB button */}
                <button
                  onClick={() => setChatOpen(!chatOpen)}
                  className="h-12 w-12 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105"
                  style={{ background: brandColor }}
                >
                  <Monitor className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Code snippet */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Codigo de integración
              </p>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                style={
                  copied
                    ? { background: "#DCFCE7", color: "#16A34A" }
                    : { background: "#F1F5F9", color: "#475569" }
                }
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copiar código
                  </>
                )}
              </button>
            </div>
            <pre
              className="rounded-xl p-4 text-xs font-mono overflow-x-auto leading-relaxed"
              style={{ background: "#0F172A", color: "#94A3B8" }}
            >
              <code>{iframeCode}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
