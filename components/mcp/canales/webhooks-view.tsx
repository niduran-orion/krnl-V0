"use client"

import { useState } from "react"
import {
  Webhook,
  Plus,
  Copy,
  Check,
  Eye,
  EyeOff,
  X,
  RefreshCw,
  ChevronRight,
  Wifi,
  WifiOff,
  Clock,
  AlertCircle,
  Terminal,
} from "lucide-react"

interface WebhookLog {
  id: string
  timestamp: string
  status: 200 | 500
  method: string
  duration: string
  body: object
}

interface WebhookEndpoint {
  id: string
  url: string
  agent: string
  secret: string
  createdAt: string
  lastCall: string | null
  totalCalls: number
  logs: WebhookLog[]
}

const SAMPLE_LOGS: WebhookLog[] = [
  {
    id: "log-1",
    timestamp: "2024-01-15 14:32:11",
    status: 200,
    method: "POST",
    duration: "142ms",
    body: { event: "message.received", from: "+5491112345678", text: "Hola, necesito ayuda", timestamp: 1705329131 },
  },
  {
    id: "log-2",
    timestamp: "2024-01-15 14:28:03",
    status: 200,
    method: "POST",
    duration: "98ms",
    body: { event: "message.received", from: "+5491198765432", text: "Quiero hacer una consulta", timestamp: 1705328883 },
  },
  {
    id: "log-3",
    timestamp: "2024-01-15 13:55:47",
    status: 500,
    method: "POST",
    duration: "3041ms",
    body: { event: "message.received", from: "+5491187654321", text: null, error: "Invalid payload structure" },
  },
  {
    id: "log-4",
    timestamp: "2024-01-15 13:10:22",
    status: 200,
    method: "POST",
    duration: "211ms",
    body: { event: "status.update", messageId: "wamid.abc123", status: "delivered" },
  },
  {
    id: "log-5",
    timestamp: "2024-01-15 12:45:09",
    status: 200,
    method: "POST",
    duration: "177ms",
    body: { event: "message.received", from: "+5491176543210", text: "Buenos días!", timestamp: 1705319109 },
  },
]

const INITIAL_WEBHOOKS: WebhookEndpoint[] = [
  {
    id: "wh-001",
    url: "https://api.krnl.ai/wh/a1b2c3d4",
    agent: "Agente Comercial",
    secret: "sk_wh_9xKp2mN8vLqR5tY3uW6jZ1",
    createdAt: "15 Ene 2024",
    lastCall: "hace 3 min",
    totalCalls: 847,
    logs: SAMPLE_LOGS,
  },
  {
    id: "wh-002",
    url: "https://api.krnl.ai/wh/e5f6g7h8",
    agent: "Soporte Técnico",
    secret: "sk_wh_4nBs7cV2wMqT9aX1pE0hG6",
    createdAt: "10 Ene 2024",
    lastCall: "hace 1 hora",
    totalCalls: 312,
    logs: SAMPLE_LOGS.slice(0, 3),
  },
  {
    id: "wh-003",
    url: "https://api.krnl.ai/wh/i9j0k1l2",
    agent: "Asistente General",
    secret: "sk_wh_7dFr3eH5xNmU8oP4kQ2lI9",
    createdAt: "5 Ene 2024",
    lastCall: null,
    totalCalls: 0,
    logs: [],
  },
]

interface LogsDrawerProps {
  webhook: WebhookEndpoint
  onClose: () => void
}

function LogsDrawer({ webhook, onClose }: LogsDrawerProps) {
  const [expandedLog, setExpandedLog] = useState<string | null>(null)

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="w-[560px] bg-white flex flex-col shadow-2xl border-l border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "#0F2870" }}>
              <Terminal className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Consola de logs</p>
              <p className="text-xs text-slate-400 font-mono">{webhook.url.replace("https://api.krnl.ai", "")}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-6 px-6 py-3 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Total:</span>
            <span className="text-xs font-semibold text-slate-800">{webhook.totalCalls} llamadas</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Agente:</span>
            <span className="text-xs font-semibold text-slate-800">{webhook.agent}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
              style={{ background: "#DCFCE7", color: "#15803D" }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
              {webhook.logs.filter((l) => l.status === 200).length} OK
            </span>
            <span
              className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
              style={{ background: "#FEE2E2", color: "#B91C1C" }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 inline-block" />
              {webhook.logs.filter((l) => l.status === 500).length} Error
            </span>
          </div>
        </div>

        {/* Logs list */}
        <div className="flex-1 overflow-y-auto">
          {webhook.logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
              <Clock className="h-8 w-8" />
              <p className="text-sm">Sin peticiones registradas aún.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {webhook.logs.map((log) => {
                const isExpanded = expandedLog === log.id
                const isOk = log.status === 200
                return (
                  <div key={log.id}>
                    <button
                      onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                      className="w-full flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors text-left"
                    >
                      {/* Status */}
                      <span
                        className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-md font-mono"
                        style={
                          isOk
                            ? { background: "#DCFCE7", color: "#15803D" }
                            : { background: "#FEE2E2", color: "#B91C1C" }
                        }
                      >
                        {log.status}
                      </span>
                      {/* Method */}
                      <span className="shrink-0 text-xs font-semibold text-slate-500 w-10">{log.method}</span>
                      {/* Timestamp */}
                      <span className="flex-1 text-xs text-slate-500 font-mono">{log.timestamp}</span>
                      {/* Duration */}
                      <span
                        className="shrink-0 text-xs font-medium"
                        style={{ color: isOk ? "#64748B" : "#EF4444" }}
                      >
                        {log.duration}
                      </span>
                      {/* Expand */}
                      <ChevronRight
                        className="h-3.5 w-3.5 shrink-0 text-slate-300 transition-transform"
                        style={{ transform: isExpanded ? "rotate(90deg)" : "none" }}
                      />
                    </button>

                    {/* Expanded JSON */}
                    {isExpanded && (
                      <div className="px-6 pb-4">
                        <pre
                          className="rounded-xl p-4 text-xs font-mono overflow-x-auto leading-relaxed"
                          style={{ background: "#0F172A", color: "#94A3B8" }}
                        >
                          {JSON.stringify(log.body, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface NewWebhookModalProps {
  open: boolean
  onClose: () => void
  onCreate: (wh: Omit<WebhookEndpoint, "id" | "secret" | "logs" | "totalCalls">) => void
}

function NewWebhookModal({ open, onClose, onCreate }: NewWebhookModalProps) {
  const [agent, setAgent] = useState("Agente Comercial")

  if (!open) return null

  const handle = () => {
    onCreate({ url: `https://api.krnl.ai/wh/${Math.random().toString(36).slice(2, 10)}`, agent, createdAt: "hoy", lastCall: null })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-[420px]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Crear nuevo webhook</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div
            className="flex items-start gap-3 rounded-xl p-3 text-xs"
            style={{ background: "#EFF8FF", border: "1px solid #BAE6FD" }}
          >
            <AlertCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-blue-800">
              Se generará una URL única y una Secret Key para autenticar las peticiones entrantes via HMAC-SHA256.
            </p>
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
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-white transition-colors">
            Cancelar
          </button>
          <button
            onClick={handle}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
            style={{ background: "#D4009A" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#A4097B")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#D4009A")}
          >
            <Plus className="h-4 w-4" />
            Crear webhook
          </button>
        </div>
      </div>
    </div>
  )
}

export function WebhooksView() {
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>(INITIAL_WEBHOOKS)
  const [modalOpen, setModalOpen] = useState(false)
  const [logsFor, setLogsFor] = useState<WebhookEndpoint | null>(null)
  const [copied, setCopied] = useState<Record<string, boolean>>({})
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, boolean>>({})
  const [testing, setTesting] = useState<Record<string, boolean>>({})
  const [testResult, setTestResult] = useState<Record<string, "ok" | "error">>({})

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopied((prev) => ({ ...prev, [id]: true }))
    setTimeout(() => setCopied((prev) => ({ ...prev, [id]: false })), 2000)
  }

  const toggleSecret = (id: string) =>
    setRevealedSecrets((prev) => ({ ...prev, [id]: !prev[id] }))

  const handleTest = (id: string) => {
    setTesting((prev) => ({ ...prev, [id]: true }))
    setTimeout(() => {
      setTesting((prev) => ({ ...prev, [id]: false }))
      setTestResult((prev) => ({ ...prev, [id]: Math.random() > 0.25 ? "ok" : "error" }))
    }, 1500)
  }

  const handleCreate = (wh: Omit<WebhookEndpoint, "id" | "secret" | "logs" | "totalCalls">) => {
    setWebhooks((prev) => [
      ...prev,
      {
        ...wh,
        id: `wh-${Date.now()}`,
        secret: `sk_wh_${Math.random().toString(36).slice(2, 26)}`,
        logs: [],
        totalCalls: 0,
      },
    ])
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <Webhook className="h-5 w-5 text-[#1B3A6E]" />
            <h1 className="text-xl font-semibold text-[#1B2A3B]">Webhooks</h1>
          </div>
          <p className="text-sm text-slate-500">
            Recibe datos externos y automatiza flujos inyectando peticiones directamente en tus agentes.
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
          Nuevo webhook
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-5 mb-8">
        {[
          { label: "ENDPOINTS", value: webhooks.length, sub: "creados" },
          { label: "LLAMADAS TOTALES", value: webhooks.reduce((a, w) => a + w.totalCalls, 0).toLocaleString(), sub: "procesadas" },
          { label: "CON ACTIVIDAD", value: webhooks.filter((w) => w.lastCall !== null).length, sub: "recibieron peticiones" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl px-5 py-4">
            <p className="text-[11px] font-semibold tracking-wider text-slate-400 mb-1">{s.label}</p>
            <p className="text-3xl font-semibold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Webhook className="h-4 w-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-800">Endpoints activos</h2>
          </div>
          <span className="text-xs text-slate-400">{webhooks.length} endpoints</span>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 w-[35%]">
                URL del endpoint
              </th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Agente destino
              </th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Secret Key
              </th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Ultima actividad
              </th>
              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-right">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {webhooks.map((wh) => {
              const isCopied = copied[wh.id]
              const isSecretRevealed = revealedSecrets[wh.id]
              const isTesting = testing[wh.id]
              const result = testResult[wh.id]

              return (
                <tr
                  key={wh.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors"
                >
                  {/* URL */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono text-slate-700 truncate max-w-[220px]">
                        {wh.url}
                      </code>
                      <button
                        onClick={() => handleCopy(wh.id, wh.url)}
                        className="p-1 rounded-md hover:bg-slate-100 transition-colors shrink-0"
                        title="Copiar URL"
                      >
                        {isCopied ? (
                          <Check className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Agent */}
                  <td className="px-5 py-4">
                    <span className="text-sm font-medium text-slate-700">{wh.agent}</span>
                  </td>

                  {/* Secret */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono text-slate-500 truncate max-w-[140px]">
                        {isSecretRevealed ? wh.secret : "sk_wh_" + "•".repeat(16)}
                      </code>
                      <button
                        onClick={() => toggleSecret(wh.id)}
                        className="p-1 rounded-md hover:bg-slate-100 transition-colors shrink-0"
                        title={isSecretRevealed ? "Ocultar" : "Revelar"}
                      >
                        {isSecretRevealed ? (
                          <EyeOff className="h-3.5 w-3.5 text-slate-400" />
                        ) : (
                          <Eye className="h-3.5 w-3.5 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Last activity */}
                  <td className="px-5 py-4">
                    {wh.lastCall ? (
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-400 inline-block" />
                        <span className="text-xs text-slate-500">{wh.lastCall}</span>
                        <span className="text-xs text-slate-400">({wh.totalCalls} total)</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-300 inline-block" />
                        <span className="text-xs text-slate-400">Sin actividad</span>
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      {/* Test result badge */}
                      {result === "ok" && (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-green-600">
                          <Wifi className="h-3.5 w-3.5" />
                          200 OK
                        </span>
                      )}
                      {result === "error" && (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-red-500">
                          <WifiOff className="h-3.5 w-3.5" />
                          500 Error
                        </span>
                      )}

                      <button
                        onClick={() => handleTest(wh.id)}
                        disabled={isTesting}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-60"
                        style={{ color: "#475569" }}
                      >
                        <RefreshCw className={`h-3 w-3 ${isTesting ? "animate-spin" : ""}`} />
                        Test
                      </button>

                      <button
                        onClick={() => setLogsFor(wh)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                        style={{ color: "#475569" }}
                      >
                        <Terminal className="h-3 w-3" />
                        Logs
                        {wh.logs.length > 0 && (
                          <span
                            className="ml-0.5 inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full text-[10px] font-semibold text-white"
                            style={{ background: "#D4009A" }}
                          >
                            {wh.logs.length}
                          </span>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modals / Drawers */}
      {logsFor && <LogsDrawer webhook={logsFor} onClose={() => setLogsFor(null)} />}
      <NewWebhookModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  )
}
