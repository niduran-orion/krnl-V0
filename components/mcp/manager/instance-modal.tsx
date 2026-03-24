"use client"

import { useState, useEffect } from "react"
import { X, Eye, EyeOff, Globe, Terminal, FileJson } from "lucide-react"
import type { MCPTemplate, MCPInstance, Area, KeyValuePair } from "@/lib/mcp-data"

interface InstanceModalProps {
  open: boolean
  template: MCPTemplate
  instance?: MCPInstance | null
  areas: Area[]
  defaultAreaId: string
  onClose: () => void
  onSave: (i: MCPInstance) => void
}

function SecretInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 pr-9 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-100"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
      >
        {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}

export function InstanceModal({
  open,
  template,
  instance,
  areas,
  defaultAreaId,
  onClose,
  onSave,
}: InstanceModalProps) {
  const [name, setName] = useState("")
  const [envValues, setEnvValues] = useState<Record<string, string>>({})
  const [areaId, setAreaId] = useState(defaultAreaId)
  const [urlOverride, setUrlOverride] = useState("")
  const [argsOverride, setArgsOverride] = useState<string[]>([])

  useEffect(() => {
    if (instance) {
      setName(instance.name)
      setEnvValues({ ...instance.envValues })
      setAreaId(instance.areaId)
      setUrlOverride(instance.urlOverride || "")
      setArgsOverride(instance.argsOverride || [])
    } else {
      // Initialize with template defaults
      setName(`${template.name} - ${areas.find(a => a.id === defaultAreaId)?.name || "Mi área"}`)
      const ev: Record<string, string> = {}
      ;(template.envVars || []).forEach((e) => (ev[e.key] = ""))
      setEnvValues(ev)
      setAreaId(defaultAreaId)
      setUrlOverride("")
      setArgsOverride([])
    }
  }, [instance, template, open, defaultAreaId, areas])

  if (!open) return null

  // Check required env vars are filled (based on envFields for required info)
  const requiredFilled = template.envFields
    .filter((f) => f.required)
    .every((f) => envValues[f.key]?.trim())

  const handleSave = () => {
    if (!requiredFilled || !name.trim()) return
    onSave({
      id: instance?.id ?? `inst-${Date.now()}`,
      templateId: template.id,
      name: name.trim(),
      areaId,
      envValues,
      urlOverride: urlOverride.trim() || undefined,
      argsOverride: argsOverride.length > 0 ? argsOverride : undefined,
      status: "active",
      createdAt: instance?.createdAt ?? new Date().toISOString().split("T")[0],
    })
    onClose()
  }

  const TransportIcon = template.transportMode === "stdio" ? Terminal : template.transportMode === "http" ? Globe : FileJson

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl border border-zinc-200 w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-zinc-100 flex items-center justify-center">
              <TransportIcon className="h-4 w-4 text-zinc-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">
                {instance ? "Editar instancia" : "Configurar servidor MCP"}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {template.transport}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
          {/* Instance name */}
          <div>
            <label className="text-xs font-medium text-zinc-700 mb-1.5 block">
              Nombre de la instancia <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: BigQuery - Producción"
              className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-100"
            />
          </div>

          {/* Area selector */}
          <div>
            <label className="text-xs font-medium text-zinc-700 mb-1.5 block">
              Asignar a área / equipo
            </label>
            <select
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
              className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 outline-none focus:border-zinc-400 bg-white"
            >
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.memberCount} miembros)
                </option>
              ))}
            </select>
          </div>

          {/* Template config summary (read-only) */}
          <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4">
            <p className="text-xs font-semibold text-zinc-600 mb-3 flex items-center gap-2">
              <TransportIcon className="h-3.5 w-3.5" />
              Configuración del template
            </p>
            
            {template.transportMode === "http" && (
              <div className="space-y-2">
                <div>
                  <p className="text-[11px] text-zinc-400 mb-0.5">URL</p>
                  <p className="text-xs font-mono bg-white border border-zinc-200 rounded px-2 py-1.5 text-zinc-700">
                    {template.url}
                  </p>
                </div>
                {(template.headers || []).length > 0 && (
                  <div>
                    <p className="text-[11px] text-zinc-400 mb-0.5">Headers</p>
                    <div className="bg-white border border-zinc-200 rounded px-2 py-1.5 space-y-1">
                      {template.headers!.map((h, i) => (
                        <p key={i} className="text-xs font-mono text-zinc-600">
                          <span className="text-zinc-400">{h.key}:</span> {h.value}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {template.transportMode === "stdio" && (
              <div className="space-y-2">
                <div>
                  <p className="text-[11px] text-zinc-400 mb-0.5">Comando</p>
                  <p className="text-xs font-mono bg-white border border-zinc-200 rounded px-2 py-1.5 text-zinc-700">
                    {template.command} {(template.args || []).join(" ")}
                  </p>
                </div>
              </div>
            )}

            {template.transportMode === "json" && (
              <div>
                <p className="text-[11px] text-zinc-400 mb-0.5">JSON Config</p>
                <pre className="text-xs font-mono bg-white border border-zinc-200 rounded px-2 py-1.5 text-zinc-700 overflow-x-auto max-h-24">
                  {template.jsonConfig || "{}"}
                </pre>
              </div>
            )}
          </div>

          {/* Env fields - only show if template has env vars */}
          {(template.envVars || []).length > 0 && (
            <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-5 w-5 rounded-md bg-sky-100 flex items-center justify-center">
                  <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3 text-sky-600">
                    <path
                      d="M8 1a7 7 0 110 14A7 7 0 018 1zm0 6a.75.75 0 00-.75.75v3a.75.75 0 001.5 0v-3A.75.75 0 008 7zm0-2.5a.75.75 0 110 1.5.75.75 0 010-1.5z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <p className="text-xs font-semibold text-sky-800">
                  Variables de entorno / Credenciales
                </p>
              </div>
              <div className="space-y-3">
                {template.envFields.map((f) => (
                  <div key={f.key}>
                    <label className="text-xs font-medium text-zinc-600 mb-1.5 block">
                      {f.label}
                      {f.required && <span className="text-red-500 ml-0.5">*</span>}
                      {!f.required && <span className="text-zinc-400 ml-1 font-normal">(opcional)</span>}
                    </label>
                    {f.secret ? (
                      <SecretInput
                        value={envValues[f.key] ?? ""}
                        onChange={(v) => setEnvValues((ev) => ({ ...ev, [f.key]: v }))}
                        placeholder={f.placeholder}
                      />
                    ) : (
                      <input
                        value={envValues[f.key] ?? ""}
                        onChange={(e) => setEnvValues((ev) => ({ ...ev, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-100 bg-white"
                      />
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-sky-600 mt-3">
                Las credenciales se almacenan de forma segura y enmascarada.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-zinc-100 bg-zinc-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-sm text-zinc-600 hover:bg-zinc-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!requiredFilled || !name.trim()}
            className="px-4 py-1.5 rounded-lg text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-700 transition-colors disabled:opacity-40"
          >
            {instance ? "Guardar cambios" : "Activar servidor"}
          </button>
        </div>
      </div>
    </div>
  )
}
