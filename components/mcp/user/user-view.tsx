"use client"

import { useState } from "react"
import { Plug2, ChevronRight, X, Activity, Terminal, Globe, Eye } from "lucide-react"
import { useMCPStore } from "@/lib/use-mcp-store"
import { mockAreas } from "@/lib/mcp-data"
import type { MCPInstance, MCPTemplate } from "@/lib/mcp-data"
import { TransportBadge } from "../transport-badge"
import { StatusBadge } from "../status-badge"

function ServerDetailPanel({
  instance,
  template,
  onClose,
}: {
  instance: MCPInstance
  template: MCPTemplate
  onClose: () => void
}) {
  const area = mockAreas.find((a) => a.id === instance.areaId)

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-[420px] h-full shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-base font-semibold text-slate-900">{instance.name}</p>
              <p className="text-sm text-slate-500 mt-0.5">{template.description}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg shrink-0 ml-2 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <TransportBadge transport={template.transport} />
            <StatusBadge status={instance.status} />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Connection info */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              {template.transportMode === "stdio" ? <Terminal className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
              Conexión
            </p>
            <div className="space-y-3">
              {template.transportMode === "http" && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-slate-600 mb-1.5">URL</p>
                  <p className="text-sm font-mono text-slate-800 break-all">
                    {instance.urlOverride || template.url || "—"}
                  </p>
                </div>
              )}
              {template.transportMode === "stdio" && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-slate-600 mb-1.5">Comando</p>
                  <p className="text-sm font-mono text-slate-800 break-all">
                    {template.command} {(instance.argsOverride || template.args || []).join(" ")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Credentials — masked */}
          {Object.keys(instance.envValues).length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Credenciales
              </p>
              <div className="space-y-3">
                {Object.entries(instance.envValues).map(([k]) => (
                  <div key={k} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <p className="text-xs font-medium text-slate-600 mb-1.5">{k}</p>
                    <p className="text-sm font-mono text-slate-500">••••••••••••••••</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-3">
                Las credenciales son administradas por tu equipo.
              </p>
            </div>
          )}

          {/* Capabilities */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Capacidades
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-lg divide-y divide-slate-200">
              {[
                { label: "Leer datos", enabled: true },
                { label: "Ejecutar acciones", enabled: true },
                { label: "Escribir datos", enabled: instance.status === "active" },
                { label: "Webhooks", enabled: false },
              ].map((cap) => (
                <div key={cap.label} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-slate-600">{cap.label}</span>
                  <span
                    className={
                      cap.enabled
                        ? "text-emerald-600 text-xs font-medium"
                        : "text-slate-400 text-xs"
                    }
                  >
                    {cap.enabled ? "Habilitado" : "No disponible"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Meta */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Información
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-lg divide-y divide-slate-200">
              <div className="flex justify-between px-4 py-3">
                <span className="text-sm text-slate-500">Template</span>
                <span className="text-sm font-medium text-slate-800">{template.name}</span>
              </div>
              <div className="flex justify-between px-4 py-3">
                <span className="text-sm text-slate-500">Área</span>
                <span className="text-sm font-medium text-slate-800">{area?.name ?? "—"}</span>
              </div>
              <div className="flex justify-between px-4 py-3">
                <span className="text-sm text-slate-500">Activa desde</span>
                <span className="text-sm font-medium text-slate-800">{instance.createdAt}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function UserView() {
  const { instances, templates, currentUser } = useMCPStore()
  const [selectedInstance, setSelectedInstance] = useState<MCPInstance | null>(null)

  const area = mockAreas.find((a) => a.id === currentUser.areaId)
  const myInstances = instances.filter((i) => i.areaId === currentUser.areaId)
  const activeCount = myInstances.filter((i) => i.status === "active").length

  const selectedTemplate = selectedInstance
    ? templates.find((t) => t.id === selectedInstance.templateId) ?? null
    : null

  const getConfigSummary = (inst: MCPInstance, tpl: MCPTemplate): string => {
    if (tpl.transportMode === "http") {
      const url = inst.urlOverride || tpl.url || ""
      return url.replace(/^https?:\/\//, "")
    }
    if (tpl.transportMode === "stdio") {
      return `${tpl.command} ${(inst.argsOverride || tpl.args || []).slice(0, 1).join(" ")}...`
    }
    return "JSON config"
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-1.5">
          <Activity className="h-5 w-5 text-[#1B3A6E]" />
          <h1 className="text-xl font-semibold text-[#1B2A3B]">Mis Servidores MCP</h1>
        </div>
        <p className="text-sm text-slate-500">
          Servidores MCP activos disponibles para tu área.
        </p>
      </div>

      {/* Area banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-8 flex items-center gap-4 shadow-sm">
        <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#1B3A6E" }}>
          <Plug2 className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-base font-semibold text-slate-900">{area?.name ?? "Mi área"}</p>
          <p className="text-sm text-slate-500">
            {area?.memberCount} miembros · {activeCount} servidor{activeCount !== 1 ? "es" : ""} MCP activo{activeCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Servers list */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-800">
              Servidores disponibles
            </h2>
          </div>
          <span className="text-xs text-slate-400">{myInstances.length} items</span>
        </div>

        {myInstances.length === 0 ? (
          <div className="p-12 text-center">
            <Plug2 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">
              Sin servidores MCP asignados
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Contacta a tu manager para que configure integraciones para tu área.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {myInstances.map((inst) => {
              const tpl = templates.find((t) => t.id === inst.templateId)
              if (!tpl) return null
              const configSummary = getConfigSummary(inst, tpl)

              return (
                <button
                  key={inst.id}
                  onClick={() => setSelectedInstance(inst)}
                  className="w-full px-5 py-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors text-left group"
                >
                  <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    {tpl.transportMode === "stdio" ? (
                      <Terminal className="h-5 w-5 text-slate-600" />
                    ) : (
                      <Globe className="h-5 w-5 text-slate-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-slate-900">{inst.name}</p>
                      <StatusBadge status={inst.status} />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <TransportBadge transport={tpl.transport} />
                      <p className="text-xs text-slate-400 truncate max-w-[240px]">
                        {configSummary}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#3968D3] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Ver detalles
                    </span>
                    <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selectedInstance && selectedTemplate && (
        <ServerDetailPanel
          instance={selectedInstance}
          template={selectedTemplate}
          onClose={() => setSelectedInstance(null)}
        />
      )}
    </div>
  )
}
