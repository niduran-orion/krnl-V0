"use client"

import { useState } from "react"
import {
  Plus,
  Eye,
  MoreVertical,
  X,
  Zap,
  ChevronDown,
  Share2,
  Check,
  Search,
  Users,
  Building2,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface LlmProvider {
  id: string
  name: string
  subName: string
  alias: string
  estado: "Configurado" | "Sin credenciales"
  endpoint: string | null
  logo: React.ReactNode
  sharedWith: SharedEntry[]
}

interface SharedEntry {
  id: string
  name: string
  type: "area" | "persona"
  permiso: "Usar" | "Editar"
  avatar?: string
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const AREAS = [
  { id: "a1", name: "Soporte al Cliente",   type: "area"    as const },
  { id: "a2", name: "Ventas",               type: "area"    as const },
  { id: "a3", name: "Marketing",            type: "area"    as const },
  { id: "a4", name: "Operaciones",          type: "area"    as const },
  { id: "a5", name: "Tecnología",           type: "area"    as const },
  { id: "p1", name: "María González",       type: "persona" as const },
  { id: "p2", name: "Carlos Rodríguez",     type: "persona" as const },
  { id: "p3", name: "Ana Martínez",         type: "persona" as const },
]

// Provider logos as inline SVG snippets
function GeminiLogo() {
  return (
    <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #4285F4, #34A853, #FBBC05, #EA4335)" }}>
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-8v4h4l-5 8z"/></svg>
    </div>
  )
}
function AnthropicLogo() {
  return (
    <div className="h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm" style={{ background: "#C9A96E", color: "#FFFFFF" }}>A\</div>
  )
}
function OpenAILogo() {
  return (
    <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "#10A37F" }}>
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white"><path d="M20.5 11.1c.3-.8.4-1.7.2-2.6-.5-2.1-2.2-3.7-4.3-4.1-.8-.2-1.6-.1-2.4.1-.5-.6-1.1-1.1-1.8-1.4C11.2 2.4 9.9 2.3 8.7 2.7 7.5 3.1 6.6 4 6.1 5.1c-.8.2-1.5.5-2.1 1-.9.8-1.5 2-1.5 3.3 0 .5.1 1 .2 1.5-.6.8-.9 1.7-.9 2.7 0 2.2 1.5 4.1 3.7 4.7.5.6 1.1 1.1 1.8 1.4 1 .7 2.3.8 3.5.4 1.2-.4 2.1-1.3 2.6-2.4.8-.2 1.5-.5 2.1-1 .9-.8 1.5-2 1.5-3.3-.1-.5-.1-1-.2-1.4z"/></svg>
    </div>
  )
}

const INITIAL_PROVIDERS: LlmProvider[] = [
  {
    id: "p1", name: "Gemini", subName: "Google AI Studio", alias: "Gemini",
    estado: "Configurado", endpoint: null,
    logo: <GeminiLogo />,
    sharedWith: [{ id: "a1", name: "Soporte al Cliente", type: "area", permiso: "Usar" }],
  },
  {
    id: "p2", name: "Gemini", subName: "Google AI Studio", alias: "gemini test",
    estado: "Configurado", endpoint: null,
    logo: <GeminiLogo />,
    sharedWith: [],
  },
  {
    id: "p3", name: "Anthropic", subName: "Anthropic", alias: "Anthropic Product",
    estado: "Configurado", endpoint: null,
    logo: <AnthropicLogo />,
    sharedWith: [
      { id: "a2", name: "Ventas",     type: "area",    permiso: "Usar"  },
      { id: "p1", name: "María González", type: "persona", permiso: "Editar" },
    ],
  },
  {
    id: "p4", name: "OpenAI", subName: "OpenAI", alias: "Ollama Onprem",
    estado: "Configurado", endpoint: "https://lite-llm.cloud.orion.global",
    logo: <OpenAILogo />,
    sharedWith: [],
  },
  {
    id: "p5", name: "Gemini", subName: "Google AI Studio", alias: "Gemini Prueba 1",
    estado: "Configurado", endpoint: null,
    logo: <GeminiLogo />,
    sharedWith: [],
  },
]

const PROVIDER_TYPES = ["OpenAI", "Anthropic", "Google AI Studio", "Mistral", "Groq", "Ollama (local)"]

// ─── Share Panel ──────────────────────────────────────────────────────────────

interface SharePanelProps {
  provider: LlmProvider
  onClose: () => void
  onUpdate: (updated: LlmProvider) => void
}

function SharePanel({ provider, onClose, onUpdate }: SharePanelProps) {
  const [scope, setScope] = useState<"personas" | "organizacion">("personas")
  const [searchQuery, setSearchQuery] = useState("")
  const [permiso, setPermiso] = useState<"Usar" | "Editar">("Usar")
  const [selectedTarget, setSelectedTarget] = useState<typeof AREAS[0] | null>(null)
  const [sharedWith, setSharedWith] = useState<SharedEntry[]>(provider.sharedWith)

  const filtered = AREAS.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !sharedWith.some((s) => s.id === a.id)
  )

  const handleShare = () => {
    if (scope === "organizacion") {
      const entry: SharedEntry = { id: "org", name: "Toda la organización", type: "area", permiso }
      const next = [entry]
      setSharedWith(next)
      onUpdate({ ...provider, sharedWith: next })
      return
    }
    if (!selectedTarget) return
    const entry: SharedEntry = { id: selectedTarget.id, name: selectedTarget.name, type: selectedTarget.type, permiso }
    const next = [...sharedWith.filter((s) => s.id !== entry.id), entry]
    setSharedWith(next)
    onUpdate({ ...provider, sharedWith: next })
    setSelectedTarget(null)
    setSearchQuery("")
  }

  const handleRemove = (id: string) => {
    const next = sharedWith.filter((s) => s.id !== id)
    setSharedWith(next)
    onUpdate({ ...provider, sharedWith: next })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.2)" }}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 flex flex-col shadow-2xl"
        style={{ width: "380px", background: "#FFFFFF" }}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: "rgba(145,158,171,0.16)" }}>
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center gap-3">
              {provider.logo}
              <div>
                <p className="text-sm font-bold" style={{ color: "#1C2434" }}>{provider.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: "rgba(15,40,112,0.08)", color: "#0F2870" }}
                  >
                    Proveedor LLM
                  </span>
                  <span className="text-[11px]" style={{ color: "#9AA3B0" }}>· Administrador</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg transition-colors"
              style={{ color: "#637381" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#F4F6F8")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">

          {/* Scope toggle */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "#637381" }}>
              Compartir con
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setScope("personas")}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all"
                style={{
                  borderColor: scope === "personas" ? "#0F2870" : "rgba(145,158,171,0.24)",
                  background: scope === "personas" ? "rgba(15,40,112,0.06)" : "#FFFFFF",
                  color: scope === "personas" ? "#0F2870" : "#637381",
                }}
              >
                <div
                  className="h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0"
                  style={{ borderColor: scope === "personas" ? "#0F2870" : "#9AA3B0" }}
                >
                  {scope === "personas" && <div className="h-2 w-2 rounded-full" style={{ background: "#0F2870" }} />}
                </div>
                Personas o áreas
              </button>
              <button
                onClick={() => setScope("organizacion")}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all"
                style={{
                  borderColor: scope === "organizacion" ? "#0F2870" : "rgba(145,158,171,0.24)",
                  background: scope === "organizacion" ? "rgba(15,40,112,0.06)" : "#FFFFFF",
                  color: scope === "organizacion" ? "#0F2870" : "#637381",
                }}
              >
                <div
                  className="h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0"
                  style={{ borderColor: scope === "organizacion" ? "#0F2870" : "#9AA3B0" }}
                >
                  {scope === "organizacion" && <div className="h-2 w-2 rounded-full" style={{ background: "#0F2870" }} />}
                </div>
                Toda la organización
              </button>
            </div>
          </div>

          {/* Search — only when personas mode */}
          {scope === "personas" && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#637381" }}>
                  Seleccionar destinatario
                </p>
                <button className="text-[11px] font-medium" style={{ color: "#0F2870" }}>Ver áreas</button>
              </div>
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#9AA3B0" }} />
                <input
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setSelectedTarget(null) }}
                  placeholder="Buscar persona, email o área..."
                  className="w-full text-sm pl-9 pr-3 py-2.5 rounded-xl border outline-none"
                  style={{ borderColor: "rgba(145,158,171,0.24)", color: "#1C2434", background: "#FFFFFF" }}
                />
              </div>
              {/* Dropdown results */}
              {searchQuery.length > 0 && filtered.length > 0 && (
                <div
                  className="mt-1 rounded-xl border overflow-hidden shadow-sm"
                  style={{ borderColor: "rgba(145,158,171,0.2)", background: "#FFFFFF" }}
                >
                  {filtered.slice(0, 5).map((a) => (
                    <button
                      key={a.id}
                      onClick={() => { setSelectedTarget(a); setSearchQuery(a.name) }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors"
                      style={{ color: "#1C2434" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#F4F6F8")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                    >
                      {a.type === "area"
                        ? <Building2 className="h-3.5 w-3.5 shrink-0" style={{ color: "#637381" }} />
                        : <Users className="h-3.5 w-3.5 shrink-0" style={{ color: "#637381" }} />
                      }
                      {a.name}
                      <span className="text-[11px] ml-auto" style={{ color: "#9AA3B0" }}>{a.type === "area" ? "Área" : "Persona"}</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedTarget && (
                <div
                  className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background: "rgba(15,40,112,0.06)", border: "1px solid rgba(15,40,112,0.15)" }}
                >
                  {selectedTarget.type === "area"
                    ? <Building2 className="h-3.5 w-3.5 shrink-0" style={{ color: "#0F2870" }} />
                    : <Users className="h-3.5 w-3.5 shrink-0" style={{ color: "#0F2870" }} />
                  }
                  <span className="text-sm font-medium flex-1" style={{ color: "#0F2870" }}>{selectedTarget.name}</span>
                  <button onClick={() => { setSelectedTarget(null); setSearchQuery("") }}>
                    <X className="h-3.5 w-3.5" style={{ color: "#0F2870" }} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Permission level */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "#637381" }}>Nivel de permiso</p>
            <div className="flex rounded-xl border overflow-hidden" style={{ borderColor: "rgba(145,158,171,0.24)" }}>
              {(["Usar", "Editar"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPermiso(p)}
                  className="flex-1 py-2 text-sm font-semibold transition-all"
                  style={{
                    background: permiso === p ? "#0F2870" : "#FFFFFF",
                    color: permiso === p ? "#FFFFFF" : "#637381",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
            <p className="text-[11px] mt-1.5 leading-relaxed" style={{ color: "#9AA3B0" }}>
              {permiso === "Usar"
                ? "* Usar permite consultar o utilizar el recurso sin modificarlo."
                : "* Editar permite modificar la configuración del proveedor."}
            </p>
          </div>

          {/* Share button */}
          <button
            onClick={handleShare}
            disabled={scope === "personas" && !selectedTarget}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
            style={{
              background: (scope === "organizacion" || selectedTarget) ? "#0F2870" : "#C4CDD5",
              cursor: (scope === "organizacion" || selectedTarget) ? "pointer" : "not-allowed",
            }}
          >
            <Share2 className="h-4 w-4" />
            Compartir
          </button>

          {/* People with access */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide mb-3" style={{ color: "#637381" }}>Con acceso</p>
            {sharedWith.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: "#9AA3B0" }}>
                Aún no se ha compartido este recurso con nadie.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {sharedWith.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                    style={{ background: "#F7F8FA" }}
                  >
                    <div
                      className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: entry.type === "area" ? "rgba(15,40,112,0.08)" : "rgba(212,0,154,0.08)" }}
                    >
                      {entry.type === "area"
                        ? <Building2 className="h-3.5 w-3.5" style={{ color: "#0F2870" }} />
                        : <Users className="h-3.5 w-3.5" style={{ color: "#D4009A" }} />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "#1C2434" }}>{entry.name}</p>
                      <p className="text-[11px]" style={{ color: "#9AA3B0" }}>{entry.type === "area" ? "Área" : "Persona"}</p>
                    </div>
                    <span
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                      style={{
                        background: entry.permiso === "Usar" ? "rgba(22,163,74,0.1)" : "rgba(217,119,6,0.1)",
                        color: entry.permiso === "Usar" ? "#16A34A" : "#D97706",
                      }}
                    >
                      {entry.permiso}
                    </span>
                    <button
                      onClick={() => handleRemove(entry.id)}
                      className="p-1 rounded transition-colors shrink-0"
                      style={{ color: "#9AA3B0" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#DC2626")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#9AA3B0")}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 border-t flex items-center justify-between"
          style={{ borderColor: "rgba(145,158,171,0.16)" }}
        >
          <button
            className="flex items-center gap-1.5 text-sm font-medium transition-colors"
            style={{ color: "#637381" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#1C2434")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#637381")}
          >
            <Check className="h-3.5 w-3.5" />
            Copiar enlace
          </button>
          <button
            onClick={onClose}
            className="text-sm font-medium px-4 py-1.5 rounded-lg border transition-colors"
            style={{ borderColor: "rgba(145,158,171,0.24)", color: "#637381" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F4F6F8")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "")}
          >
            Cerrar
          </button>
        </div>
      </div>
    </>
  )
}

// ─── New Config Modal ─────────────────────────────────────────────────────────

interface NewConfigModalProps {
  onClose: () => void
  onAdd: (provider: LlmProvider) => void
}

function NewConfigModal({ onClose, onAdd }: NewConfigModalProps) {
  const [alias, setAlias] = useState("")
  const [providerType, setProviderType] = useState("OpenAI")
  const [endpoint, setEndpoint] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [testing, setTesting] = useState(false)
  const [tested, setTested] = useState(false)

  const handleTest = () => {
    setTesting(true)
    setTimeout(() => { setTesting(false); setTested(true) }, 1500)
  }

  const handleAdd = () => {
    if (!alias) return
    const logoMap: Record<string, React.ReactNode> = {
      "OpenAI": <OpenAILogo />,
      "Anthropic": <AnthropicLogo />,
      "Google AI Studio": <GeminiLogo />,
    }
    const newProvider: LlmProvider = {
      id: `p${Date.now()}`,
      name: providerType,
      subName: providerType,
      alias,
      estado: "Configurado",
      endpoint: endpoint || null,
      logo: logoMap[providerType] ?? <OpenAILogo />,
      sharedWith: [],
    }
    onAdd(newProvider)
    onClose()
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.35)" }}
        onClick={onClose}
      />
      <div
        className="fixed z-50 rounded-2xl shadow-2xl w-full max-w-md"
        style={{
          background: "#FFFFFF",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        {/* Modal header */}
        <div className="px-6 py-5 border-b" style={{ borderColor: "rgba(145,158,171,0.16)" }}>
          <p className="text-base font-bold" style={{ color: "#1C2434" }}>Nueva configuración</p>
        </div>

        {/* Fields */}
        <div className="px-6 py-5 flex flex-col gap-4">
          <input
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            placeholder="Alias"
            className="w-full text-sm px-4 py-2.5 rounded-xl border outline-none"
            style={{ borderColor: "rgba(145,158,171,0.24)", color: "#1C2434" }}
          />

          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "#637381" }}>Tipo de proveedor</label>
            <div className="relative">
              <select
                value={providerType}
                onChange={(e) => setProviderType(e.target.value)}
                className="w-full appearance-none text-sm pl-10 pr-8 py-2.5 rounded-xl border outline-none"
                style={{ borderColor: "rgba(145,158,171,0.24)", color: "#1C2434", background: "#FFFFFF" }}
              >
                {PROVIDER_TYPES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <div className="h-4 w-4 rounded" style={{ background: "#10A37F" }} />
              </div>
              <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#9AA3B0" }} />
            </div>
          </div>

          <input
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder="URL del endpoint (opcional)"
            className="w-full text-sm px-4 py-2.5 rounded-xl border outline-none"
            style={{ borderColor: "rgba(145,158,171,0.24)", color: "#1C2434" }}
          />

          <input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Credenciales (API Key)"
            type="password"
            className="w-full text-sm px-4 py-2.5 rounded-xl border outline-none"
            style={{ borderColor: "rgba(145,158,171,0.24)", color: "#1C2434" }}
          />

          <button
            onClick={handleTest}
            disabled={testing}
            className="self-start flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors"
            style={{ borderColor: "rgba(145,158,171,0.24)", color: tested ? "#16A34A" : "#637381", background: tested ? "rgba(22,163,74,0.06)" : "#FFFFFF" }}
          >
            {tested
              ? <Check className="h-3.5 w-3.5" />
              : <Zap className="h-3.5 w-3.5" />
            }
            {testing ? "Probando..." : tested ? "Conexión exitosa" : "Probar conexión"}
          </button>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 border-t flex items-center justify-end gap-3"
          style={{ borderColor: "rgba(145,158,171,0.16)" }}
        >
          <button
            onClick={onClose}
            className="text-sm font-medium px-4 py-2 rounded-xl border transition-colors"
            style={{ borderColor: "rgba(145,158,171,0.24)", color: "#637381" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F4F6F8")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "")}
          >
            Cancelar
          </button>
          <button
            onClick={handleAdd}
            disabled={!alias}
            className="text-sm font-semibold px-4 py-2 rounded-xl text-white transition-all"
            style={{ background: alias ? "#0F2870" : "#C4CDD5", cursor: alias ? "pointer" : "not-allowed" }}
          >
            Añadir proveedor
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Action Menu ──────────────────────────────────────────────────────────────

function ActionMenu({ onShare, onClose }: { onShare: () => void; onClose: () => void }) {
  return (
    <div
      className="absolute right-0 top-8 z-30 rounded-xl border shadow-lg py-1 w-44"
      style={{ background: "#FFFFFF", borderColor: "rgba(145,158,171,0.2)" }}
    >
      {[
        { label: "Ver modelos",  action: onClose },
        { label: "Compartir",    action: onShare },
        { label: "Editar",       action: onClose },
        { label: "Eliminar",     action: onClose, danger: true },
      ].map(({ label, action, danger }) => (
        <button
          key={label}
          onClick={() => { action(); onClose() }}
          className="w-full text-left px-4 py-2 text-sm transition-colors"
          style={{ color: danger ? "#DC2626" : "#1C2434" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = danger ? "rgba(220,38,38,0.04)" : "#F4F6F8")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "")}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// ─── Main view ────────────────────────────────────────────────────────────────

export function GestionLlmView() {
  const [providers, setProviders] = useState<LlmProvider[]>(INITIAL_PROVIDERS)
  const [showModal, setShowModal] = useState(false)
  const [shareTarget, setShareTarget] = useState<LlmProvider | null>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [rowsPerPage] = useState(10)

  const configured = providers.filter((p) => p.estado === "Configurado").length
  const sinCredenciales = providers.filter((p) => p.estado === "Sin credenciales").length

  const handleAdd = (p: LlmProvider) => setProviders((prev) => [...prev, p])
  const handleUpdate = (updated: LlmProvider) =>
    setProviders((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "#F7F8FA" }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-8 py-5 border-b shrink-0"
        style={{ background: "#FFFFFF", borderColor: "rgba(145,158,171,0.16)" }}
      >
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1C2434" }}>Gestión de LLM</h1>
          <p className="text-sm mt-0.5" style={{ color: "#637381" }}>
            Administra tus configuraciones y proveedores de modelos de lenguaje.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
          style={{ background: "#0F2870" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#0A1F5C")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#0F2870")}
        >
          <Plus className="h-4 w-4" />
          Añadir nueva configuración
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6">

        {/* ── KPI cards ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-5">
          {[
            { label: "PROVEEDORES", value: providers.length, sub: "configurados",       color: "#1C2434" },
            { label: "CONFIGURADOS", value: configured,       sub: "con credenciales",   color: "#16A34A" },
            { label: "SIN CREDENCIALES", value: sinCredenciales, sub: "requieren atención", color: sinCredenciales > 0 ? "#DC2626" : "#1C2434" },
          ].map(({ label, value, sub, color }) => (
            <div
              key={label}
              className="rounded-2xl border px-6 py-5"
              style={{ background: "#FFFFFF", borderColor: "rgba(145,158,171,0.16)" }}
            >
              <p className="text-[11px] font-semibold tracking-wider uppercase mb-2" style={{ color: "#9AA3B0" }}>{label}</p>
              <p className="text-4xl font-bold" style={{ color }}>{value}</p>
              <p className="text-sm mt-1" style={{ color: "#637381" }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* ── Table ───────────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ background: "#FFFFFF", borderColor: "rgba(145,158,171,0.16)" }}
        >
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ background: "#F7F8FA", borderBottom: "1px solid rgba(145,158,171,0.16)" }}>
                {["PROVEEDOR", "ALIAS", "ESTADO", "ENDPOINT", "COMPARTIDO CON", "ACCIONES"].map((h, i) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3.5 text-[11px] font-semibold tracking-wider"
                    style={{ color: "#637381", textAlign: i === 5 ? "right" : "left" }}
                  >
                    {h}{h === "PROVEEDOR" && <span className="ml-1 inline-block">↓</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {providers.slice(0, rowsPerPage).map((prov) => (
                <tr
                  key={prov.id}
                  className="border-t transition-colors"
                  style={{ borderColor: "rgba(145,158,171,0.1)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFBFC")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                >
                  {/* Proveedor */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {prov.logo}
                      <div>
                        <p className="font-semibold" style={{ color: "#1C2434" }}>{prov.name}</p>
                        <p className="text-xs" style={{ color: "#9AA3B0" }}>{prov.subName}</p>
                      </div>
                    </div>
                  </td>

                  {/* Alias */}
                  <td className="px-5 py-3.5">
                    <span className="text-sm" style={{ color: "#454F5B" }}>{prov.alias}</span>
                  </td>

                  {/* Estado */}
                  <td className="px-5 py-3.5">
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{
                        background: prov.estado === "Configurado" ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.1)",
                        color: prov.estado === "Configurado" ? "#16A34A" : "#DC2626",
                      }}
                    >
                      {prov.estado}
                    </span>
                  </td>

                  {/* Endpoint */}
                  <td className="px-5 py-3.5">
                    {prov.endpoint ? (
                      <span className="text-xs font-mono" style={{ color: "#637381" }}>{prov.endpoint}</span>
                    ) : (
                      <span style={{ color: "#C4CDD5" }}>—</span>
                    )}
                  </td>

                  {/* Compartido con */}
                  <td className="px-5 py-3.5">
                    {prov.sharedWith.length === 0 ? (
                      <span className="text-xs" style={{ color: "#C4CDD5" }}>Sin compartir</span>
                    ) : (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {prov.sharedWith.slice(0, 2).map((s) => (
                          <span
                            key={s.id}
                            className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(15,40,112,0.08)", color: "#0F2870" }}
                          >
                            {s.name}
                          </span>
                        ))}
                        {prov.sharedWith.length > 2 && (
                          <span className="text-[11px]" style={{ color: "#9AA3B0" }}>+{prov.sharedWith.length - 2}</span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Acciones */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2 relative">
                      {/* Ver modelos */}
                      <button
                        className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors"
                        style={{ borderColor: "rgba(145,158,171,0.24)", color: "#637381", background: "#FFFFFF" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#F4F6F8")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Ver modelos
                      </button>

                      {/* Compartir */}
                      <button
                        onClick={() => setShareTarget(prov)}
                        className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors"
                        style={{ borderColor: "rgba(212,0,154,0.3)", color: "#D4009A", background: "rgba(212,0,154,0.04)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(212,0,154,0.1)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(212,0,154,0.04)")}
                      >
                        <Share2 className="h-3.5 w-3.5" />
                        Compartir
                      </button>

                      {/* Three-dot menu */}
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenu(openMenu === prov.id ? null : prov.id)}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: "#637381" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#F4F6F8")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {openMenu === prov.id && (
                          <ActionMenu
                            onShare={() => { setShareTarget(prov); setOpenMenu(null) }}
                            onClose={() => setOpenMenu(null)}
                          />
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Table footer */}
          <div
            className="flex items-center justify-between px-5 py-3 border-t"
            style={{ borderColor: "rgba(145,158,171,0.12)" }}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: "#637381" }}>Filas</span>
              <select
                className="text-xs border rounded px-2 py-1 outline-none"
                style={{ borderColor: "rgba(145,158,171,0.24)", color: "#1C2434" }}
                defaultValue={10}
              >
                {[10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs" style={{ color: "#637381" }}>1–{Math.min(rowsPerPage, providers.length)} de {providers.length}</span>
              <div className="flex gap-1">
                {["‹", "›"].map((arrow, i) => (
                  <button
                    key={arrow}
                    className="h-7 w-7 flex items-center justify-center rounded border text-sm transition-colors"
                    style={{ borderColor: "rgba(145,158,171,0.24)", color: i === 0 ? "#C4CDD5" : "#1C2434" }}
                    disabled={i === 0}
                  >
                    {arrow}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-xs pb-2" style={{ color: "#9AA3B0" }}>
          Los modelos disponibles para cada conexión se sincronizan automáticamente al crearla y se revisan diariamente.
          Pulsa "Ver modelos" para inspeccionar el catálogo, re-sincronizar manualmente o probar un modelo.
        </p>
      </div>

      {/* ── Modals / panels ─────────────────────────────────────────────────── */}
      {showModal && (
        <NewConfigModal onClose={() => setShowModal(false)} onAdd={handleAdd} />
      )}
      {shareTarget && (
        <SharePanel
          provider={shareTarget}
          onClose={() => setShareTarget(null)}
          onUpdate={handleUpdate}
        />
      )}

      {/* Click outside to close action menu */}
      {openMenu && (
        <div className="fixed inset-0 z-20" onClick={() => setOpenMenu(null)} />
      )}
    </div>
  )
}
