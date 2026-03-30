"use client"

import { useState } from "react"
import {
  Plus,
  MessageCircle,
  Send,
  X,
  ChevronRight,
  Wifi,
  WifiOff,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
} from "lucide-react"

type ChannelStatus = "active" | "pending" | "error"
type ChannelType = "whatsapp" | "telegram" | "instagram"

interface Channel {
  id: string
  type: ChannelType
  alias: string
  agent: string
  status: ChannelStatus
  phone?: string
  lastActivity: string
}

const INITIAL_CHANNELS: Channel[] = [
  {
    id: "ch-001",
    type: "whatsapp",
    alias: "WhatsApp Ventas",
    agent: "Agente Comercial",
    status: "active",
    phone: "+54 11 1234-5678",
    lastActivity: "hace 5 min",
  },
  {
    id: "ch-002",
    type: "telegram",
    alias: "Telegram Soporte",
    agent: "Soporte Técnico",
    status: "pending",
    lastActivity: "hace 2 horas",
  },
  {
    id: "ch-003",
    type: "instagram",
    alias: "Instagram Marca",
    agent: "Asistente General",
    status: "error",
    lastActivity: "hace 1 día",
  },
]

const STATUS_CONFIG: Record<ChannelStatus, { label: string; bg: string; text: string; dot: string }> = {
  active:  { label: "Activo",            bg: "#DCFCE7", text: "#15803D", dot: "#22C55E" },
  pending: { label: "Pendiente de Auth", bg: "#FEF9C3", text: "#A16207", dot: "#EAB308" },
  error:   { label: "Error",             bg: "#FEE2E2", text: "#B91C1C", dot: "#EF4444" },
}

// Channel type icons as SVG paths (official brand monochrome representations)
function ChannelIcon({ type, size = 20 }: { type: ChannelType; size?: number }) {
  if (type === "whatsapp") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.546 21l3.94-.876A9.953 9.953 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"
          fill="#25D366"
        />
        <path
          d="M16.75 14.25c-.25-.125-1.5-.75-1.75-.825-.25-.1-.425-.125-.6.125-.175.25-.675.825-.825 1-.15.175-.3.2-.55.075-.25-.125-1.075-.4-2.05-1.275-.75-.675-1.275-1.5-1.425-1.75-.15-.25-.025-.4.1-.525.125-.1.25-.275.375-.425.125-.15.175-.25.25-.425.1-.175.05-.325-.025-.45-.075-.125-.6-1.45-.825-1.975-.225-.525-.45-.45-.625-.45h-.525c-.175 0-.45.075-.7.325-.25.25-.95.925-.95 2.25s.975 2.625 1.1 2.8c.125.175 1.925 2.95 4.65 4.025.65.275 1.15.45 1.55.575.65.2 1.25.175 1.725.1.525-.075 1.625-.65 1.85-1.3.225-.625.225-1.175.15-1.275-.075-.1-.25-.175-.5-.3z"
          fill="white"
        />
      </svg>
    )
  }
  if (type === "telegram") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#229ED9" />
        <path
          d="M5.5 11.5l10-4-3.5 10-2-3.5-4.5-2.5z"
          fill="white"
          stroke="white"
          strokeWidth="0.5"
        />
        <path d="M10 14l0.75-2.5L15 8" stroke="#229ED9" strokeWidth="1" />
      </svg>
    )
  }
  // instagram
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFC107" />
          <stop offset="50%" stopColor="#E91E63" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#ig-grad)" />
      <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="1.5" fill="none" />
      <circle cx="17" cy="7" r="1.2" fill="white" />
    </svg>
  )
}

type WizardStep = "type" | "config" | "verify"

interface ConnectModalProps {
  open: boolean
  onClose: () => void
  onConnect: (channel: Omit<Channel, "id">) => void
}

function ConnectModal({ open, onClose, onConnect }: ConnectModalProps) {
  const [step, setStep] = useState<WizardStep>("type")
  const [selectedType, setSelectedType] = useState<ChannelType>("whatsapp")
  const [alias, setAlias] = useState("")
  const [agent, setAgent] = useState("Agente Comercial")
  const [apiKey, setApiKey] = useState("")
  const [phoneId, setPhoneId] = useState("")
  const [botToken, setBotToken] = useState("")

  if (!open) return null

  const handleConnect = () => {
    onConnect({
      type: selectedType,
      alias: alias || `${selectedType} - ${agent}`,
      agent,
      status: "pending",
      lastActivity: "ahora",
    })
    onClose()
    setStep("type")
    setAlias("")
    setApiKey("")
    setPhoneId("")
    setBotToken("")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-[520px] overflow-hidden">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Conectar nuevo canal</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {step === "type" && "Elige el tipo de canal"}
              {step === "config" && "Configura las credenciales"}
              {step === "verify" && "Verifica la conexión"}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-0 px-6 py-3 bg-slate-50 border-b border-slate-100">
          {(["type", "config", "verify"] as WizardStep[]).map((s, i) => {
            const labels = ["Tipo", "Config", "Verificar"]
            const isActive = s === step
            const isDone = (["type", "config", "verify"] as WizardStep[]).indexOf(step) > i
            return (
              <div key={s} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div
                    className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold"
                    style={
                      isDone
                        ? { background: "#22C55E", color: "white" }
                        : isActive
                        ? { background: "#0F2870", color: "white" }
                        : { background: "#E2E8F0", color: "#94A3B8" }
                    }
                  >
                    {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                  <span
                    className="text-xs font-medium"
                    style={{ color: isActive ? "#0F2870" : isDone ? "#15803D" : "#94A3B8" }}
                  >
                    {labels[i]}
                  </span>
                </div>
                {i < 2 && <ChevronRight className="h-3.5 w-3.5 mx-2 text-slate-300" />}
              </div>
            )
          })}
        </div>

        {/* Step content */}
        <div className="p-6">
          {step === "type" && (
            <div className="space-y-3">
              {(["whatsapp", "telegram", "instagram"] as ChannelType[]).map((t) => {
                const labels: Record<ChannelType, string> = {
                  whatsapp: "WhatsApp Business",
                  telegram: "Telegram Bot",
                  instagram: "Instagram Direct",
                }
                const descs: Record<ChannelType, string> = {
                  whatsapp: "Conecta via WhatsApp Cloud API",
                  telegram: "Crea un bot con BotFather",
                  instagram: "Integra con Instagram Messaging API",
                }
                return (
                  <button
                    key={t}
                    onClick={() => setSelectedType(t)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all"
                    style={
                      selectedType === t
                        ? { borderColor: "#0F2870", background: "#F0F4FF" }
                        : { borderColor: "#E2E8F0", background: "#FAFAFA" }
                    }
                  >
                    <ChannelIcon type={t} size={28} />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{labels[t]}</p>
                      <p className="text-xs text-slate-400">{descs[t]}</p>
                    </div>
                    {selectedType === t && (
                      <CheckCircle2 className="h-5 w-5 ml-auto shrink-0 text-[#0F2870]" />
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {step === "config" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Alias del canal</label>
                <input
                  type="text"
                  placeholder={`Ej: ${selectedType === "whatsapp" ? "WhatsApp Ventas" : selectedType === "telegram" ? "Bot Soporte" : "Instagram Marca"}`}
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#D4009A] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Agente destino</label>
                <select
                  value={agent}
                  onChange={(e) => setAgent(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#D4009A] transition-colors"
                >
                  <option>Agente Comercial</option>
                  <option>Soporte Técnico</option>
                  <option>Asistente General</option>
                </select>
              </div>

              {selectedType === "whatsapp" && (
                <>
                  <div
                    className="flex items-start gap-3 rounded-xl p-3 text-xs"
                    style={{ background: "#FFF7ED", border: "1px solid #FED7AA" }}
                  >
                    <AlertCircle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                    <p className="text-orange-800">
                      <strong>Paso 1:</strong> Crea una app en Meta for Developers y obtén tu API Key y Phone Number ID desde el panel de WhatsApp Business.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">API Key (Access Token)</label>
                    <input
                      type="password"
                      placeholder="EAAxxxxxxxxxxxxx..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-mono outline-none focus:border-[#D4009A] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number ID</label>
                    <input
                      type="text"
                      placeholder="1234567890..."
                      value={phoneId}
                      onChange={(e) => setPhoneId(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-mono outline-none focus:border-[#D4009A] transition-colors"
                    />
                  </div>
                </>
              )}

              {selectedType === "telegram" && (
                <>
                  <div
                    className="flex items-start gap-3 rounded-xl p-3 text-xs"
                    style={{ background: "#EFF8FF", border: "1px solid #BAE6FD" }}
                  >
                    <AlertCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-blue-800">
                      <strong>Paso 1:</strong> Habla con @BotFather en Telegram, crea un nuevo bot con /newbot y copia el token que te proporciona.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Bot Token</label>
                    <input
                      type="password"
                      placeholder="123456:ABCdefGhIjklMnOpQrSt..."
                      value={botToken}
                      onChange={(e) => setBotToken(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-mono outline-none focus:border-[#D4009A] transition-colors"
                    />
                  </div>
                </>
              )}

              {selectedType === "instagram" && (
                <div
                  className="flex items-start gap-3 rounded-xl p-3 text-xs"
                  style={{ background: "#FDF4FF", border: "1px solid #E9D5FF" }}
                >
                  <AlertCircle className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                  <p className="text-purple-800">
                    <strong>Paso 1:</strong> Vincula tu cuenta de Instagram Business a una página de Facebook. Luego genera un token de acceso desde Meta for Developers con permisos instagram_manage_messages.
                  </p>
                </div>
              )}
            </div>
          )}

          {step === "verify" && (
            <div className="space-y-4">
              <div
                className="flex items-center gap-4 rounded-xl p-4"
                style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}
              >
                <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "#22C55E" }}>
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-800">Credenciales guardadas</p>
                  <p className="text-xs text-green-600">La conexión se activará en unos segundos.</p>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Canal</span>
                  <span className="font-medium text-slate-800">{alias || "Sin alias"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Tipo</span>
                  <span className="font-medium text-slate-800 capitalize">{selectedType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Agente</span>
                  <span className="font-medium text-slate-800">{agent}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Estado inicial</span>
                  <span className="font-medium text-amber-600">Pendiente de Auth</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button
            onClick={() => {
              if (step === "type") onClose()
              if (step === "config") setStep("type")
              if (step === "verify") setStep("config")
            }}
            className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-white transition-colors"
          >
            {step === "type" ? "Cancelar" : "Anterior"}
          </button>
          <button
            onClick={() => {
              if (step === "type") setStep("config")
              if (step === "config") setStep("verify")
              if (step === "verify") handleConnect()
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
            style={{ background: "#D4009A" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#A4097B")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#D4009A")}
          >
            {step === "verify" ? "Activar canal" : "Siguiente"}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function MensajeriaView() {
  const [channels, setChannels] = useState<Channel[]>(INITIAL_CHANNELS)
  const [modalOpen, setModalOpen] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<Record<string, "ok" | "error">>({})

  const handleConnect = (channel: Omit<Channel, "id">) => {
    setChannels((prev) => [...prev, { ...channel, id: `ch-${Date.now()}` }])
  }

  const handleTest = (id: string) => {
    setTesting(id)
    setTestResult((prev) => ({ ...prev, [id]: undefined as any }))
    setTimeout(() => {
      setTesting(null)
      setTestResult((prev) => ({ ...prev, [id]: Math.random() > 0.3 ? "ok" : "error" }))
    }, 1500)
  }

  const active = channels.filter((c) => c.status === "active").length
  const pending = channels.filter((c) => c.status === "pending").length

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <MessageCircle className="h-5 w-5 text-[#1B3A6E]" />
            <h1 className="text-xl font-semibold text-[#1B2A3B]">Mensajería y RRSS</h1>
          </div>
          <p className="text-sm text-slate-500">
            Gestiona las cuentas de WhatsApp, Telegram e Instagram conectadas a tus agentes.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          style={{ background: "#D4009A" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#A4097B")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#D4009A")}
        >
          <Plus className="h-4 w-4" />
          Conectar nuevo canal
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-5 mb-8">
        {[
          { label: "CANALES TOTALES", value: channels.length, sub: "conectados" },
          { label: "ACTIVOS", value: active, sub: "en línea" },
          { label: "PENDIENTES", value: pending, sub: "requieren acción" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl px-5 py-4">
            <p className="text-[11px] font-semibold tracking-wider text-slate-400 mb-1">{s.label}</p>
            <p className="text-3xl font-semibold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Channel list */}
      {channels.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center py-20 gap-4">
          <div className="h-16 w-16 rounded-2xl flex items-center justify-center" style={{ background: "#F1F5F9" }}>
            <MessageCircle className="h-8 w-8 text-slate-400" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-700 mb-1">Sin canales conectados</p>
            <p className="text-sm text-slate-400">Conecta tu primer canal de mensajería para comenzar.</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 text-white text-sm font-medium px-4 py-2.5 rounded-lg mt-2 transition-colors"
            style={{ background: "#D4009A" }}
          >
            <Plus className="h-4 w-4" />
            Crear primer canal
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {channels.map((ch) => {
            const cfg = STATUS_CONFIG[ch.status]
            const result = testResult[ch.id]
            const isTesting = testing === ch.id
            return (
              <div
                key={ch.id}
                className="bg-white border border-slate-200 rounded-xl px-5 py-4 flex items-center gap-5 hover:border-slate-300 transition-colors"
              >
                {/* Icon */}
                <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0 border border-slate-100">
                  <ChannelIcon type={ch.type} size={24} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-slate-800 text-sm">{ch.alias}</p>
                    <span
                      className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
                      style={{ background: cfg.bg, color: cfg.text }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full inline-block" style={{ background: cfg.dot }} />
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Agente: <span className="text-slate-600 font-medium">{ch.agent}</span>
                    {ch.phone && <> &middot; {ch.phone}</>}
                    {" "}&middot; {ch.lastActivity}
                  </p>
                </div>

                {/* Test result */}
                {result === "ok" && (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-green-600">
                    <Wifi className="h-3.5 w-3.5" />
                    Conexión OK
                  </div>
                )}
                {result === "error" && (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-red-500">
                    <WifiOff className="h-3.5 w-3.5" />
                    Sin respuesta
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleTest(ch.id)}
                    disabled={isTesting}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-60"
                    style={{ color: "#475569" }}
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isTesting ? "animate-spin" : ""}`} />
                    {isTesting ? "Probando..." : "Test"}
                  </button>
                  <button
                    className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    style={{ color: "#475569" }}
                  >
                    Configurar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ConnectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConnect={handleConnect}
      />
    </div>
  )
}
