"use client"

import { useState, useEffect } from "react"
import { X, Plus, Trash2, Globe } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MCPTemplate, TransportMode, KeyValuePair } from "@/lib/mcp-data"

interface TemplateModalProps {
  open: boolean
  template?: MCPTemplate | null
  onClose: () => void
  onSave: (t: MCPTemplate) => void
}

const emptyTemplate = (): MCPTemplate => ({
  id: `tpl-${Date.now()}`,
  name: "",
  description: "",
  transport: "Streamable HTTP",
  transportMode: "http",
  url: "",
  headers: [],
  envVars: [],
  configFields: [],
  envFields: [],
  status: "active",
  createdAt: new Date().toISOString().split("T")[0],
})

function KeyValueRow({
  pair,
  onChange,
  onRemove,
  showGlobe = false,
  keyPlaceholder = "Type key...",
  valuePlaceholder = "Type a value...",
}: {
  pair: KeyValuePair
  onChange: (p: KeyValuePair) => void
  onRemove: () => void
  showGlobe?: boolean
  keyPlaceholder?: string
  valuePlaceholder?: string
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        value={pair.key}
        onChange={(e) => onChange({ ...pair, key: e.target.value })}
        className="flex-1 text-sm border border-zinc-200 rounded-lg px-3 py-2 outline-none focus:border-zinc-400 bg-white"
        placeholder={keyPlaceholder}
      />
      <input
        value={pair.value}
        onChange={(e) => onChange({ ...pair, value: e.target.value })}
        className="flex-1 text-sm border border-zinc-200 rounded-lg px-3 py-2 outline-none focus:border-zinc-400 bg-white"
        placeholder={valuePlaceholder}
      />
      {showGlobe && (
        <button className="p-2 text-zinc-400 hover:text-zinc-600" title="Variable de entorno">
          <Globe className="h-4 w-4" />
        </button>
      )}
      <button
        onClick={onRemove}
        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

function AddRow({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center w-full py-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 rounded-lg border border-dashed border-zinc-200"
    >
      <Plus className="h-4 w-4" />
    </button>
  )
}

export function TemplateModal({ open, template, onClose, onSave }: TemplateModalProps) {
  const [form, setForm] = useState<MCPTemplate>(emptyTemplate())
  const [mode, setMode] = useState<TransportMode>("http")
  const [args, setArgs] = useState<string[]>([])

  useEffect(() => {
    if (open) {
      if (template) {
        setForm({ ...template })
        setMode(template.transportMode || "http")
        setArgs(template.args || [])
      } else {
        setForm(emptyTemplate())
        setMode("http")
        setArgs([])
      }
    }
  }, [template, open])

  if (!open) return null

  const updateMode = (newMode: TransportMode) => {
    setMode(newMode)
    let transport: MCPTemplate["transport"] = "Streamable HTTP"
    if (newMode === "stdio") {
      transport = form.command?.startsWith("uvx") ? "UVX (stdio)" : "NPX (stdio)"
    }
    setForm((f) => ({ ...f, transportMode: newMode, transport }))
  }

  const addHeader = () =>
    setForm((f) => ({ ...f, headers: [...(f.headers || []), { key: "", value: "" }] }))

  const updateHeader = (i: number, p: KeyValuePair) =>
    setForm((f) => {
      const arr = [...(f.headers || [])]
      arr[i] = p
      return { ...f, headers: arr }
    })

  const removeHeader = (i: number) =>
    setForm((f) => ({ ...f, headers: (f.headers || []).filter((_, idx) => idx !== i) }))

  const addEnvVar = () =>
    setForm((f) => ({ ...f, envVars: [...(f.envVars || []), { key: "", value: "" }] }))

  const updateEnvVar = (i: number, p: KeyValuePair) =>
    setForm((f) => {
      const arr = [...(f.envVars || [])]
      arr[i] = p
      return { ...f, envVars: arr }
    })

  const removeEnvVar = (i: number) =>
    setForm((f) => ({ ...f, envVars: (f.envVars || []).filter((_, idx) => idx !== i) }))

  const addArg = () => setArgs((a) => [...a, ""])

  const updateArg = (i: number, val: string) =>
    setArgs((a) => {
      const arr = [...a]
      arr[i] = val
      return arr
    })

  const removeArg = (i: number) => setArgs((a) => a.filter((_, idx) => idx !== i))

  const handleSave = () => {
    if (!form.name.trim()) return
    
    // Build final template based on mode
    const finalTemplate: MCPTemplate = {
      ...form,
      transportMode: mode,
      args: mode === "stdio" ? args.filter(Boolean) : undefined,
    }

    // Set transport based on command
    if (mode === "stdio") {
      finalTemplate.transport = form.command?.startsWith("uvx") ? "UVX (stdio)" : "NPX (stdio)"
    } else {
      finalTemplate.transport = "Streamable HTTP"
    }

    onSave(finalTemplate)
    onClose()
  }

  const tabs: { key: TransportMode; label: string }[] = [
    { key: "json", label: "JSON" },
    { key: "stdio", label: "STDIO" },
    { key: "http", label: "Streamable HTTP/SSE" },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl border border-zinc-200 w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-zinc-100 rounded-lg">
              <svg className="h-4 w-4 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">
                {template ? "Editar MCP Server" : "Add MCP Server"}
              </h2>
              <p className="text-xs text-zinc-400">
                Add and save MCP servers. Manage servers in{" "}
                <span className="underline cursor-pointer">settings</span>.
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

        {/* Transport Mode Tabs */}
        <div className="px-5 pt-4">
          <div className="flex bg-zinc-100 rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => updateMode(tab.key)}
                className={cn(
                  "flex-1 py-2 px-3 text-xs font-medium rounded-md transition-colors",
                  mode === tab.key
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {/* JSON Mode */}
          {mode === "json" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-zinc-700 mb-1.5 block">
                  Paste in JSON config
                </label>
                <textarea
                  value={form.jsonConfig || ""}
                  onChange={(e) => setForm((f) => ({ ...f, jsonConfig: e.target.value }))}
                  rows={12}
                  className="w-full text-sm font-mono border border-zinc-200 rounded-lg px-3 py-2 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 resize-none bg-zinc-50"
                  placeholder="Paste in JSON config to add server"
                />
              </div>
            </div>
          )}

          {/* STDIO Mode */}
          {mode === "stdio" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-zinc-700 mb-1.5 block">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200"
                  placeholder="Type server name..."
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700 mb-1.5 block">
                  Command <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.command || ""}
                  onChange={(e) => setForm((f) => ({ ...f, command: e.target.value }))}
                  className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200"
                  placeholder="Type command..."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-zinc-700">Arguments</label>
                  <button
                    onClick={addArg}
                    className="p-1 text-zinc-400 hover:text-zinc-600"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {args.length === 0 ? (
                    <p className="text-xs text-zinc-400 py-2">No arguments added yet</p>
                  ) : (
                    args.map((arg, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          value={arg}
                          onChange={(e) => updateArg(i, e.target.value)}
                          className="flex-1 text-sm border border-zinc-200 rounded-lg px-3 py-2 outline-none focus:border-zinc-400 bg-white"
                          placeholder="Type argument..."
                        />
                        <button
                          onClick={() => removeArg(i)}
                          className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-zinc-700">Environment Variables</label>
                  <button
                    onClick={addEnvVar}
                    className="p-1 text-zinc-400 hover:text-zinc-600"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {(form.envVars || []).length === 0 ? (
                    <p className="text-xs text-zinc-400 py-2">No environment variables added</p>
                  ) : (
                    (form.envVars || []).map((ev, i) => (
                      <KeyValueRow
                        key={i}
                        pair={ev}
                        onChange={(p) => updateEnvVar(i, p)}
                        onRemove={() => removeEnvVar(i)}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* HTTP Mode */}
          {mode === "http" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-zinc-700 mb-1.5 block">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200"
                  placeholder="Name"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700 mb-1.5 block">
                  Streamable HTTP/SSE URL <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.url || ""}
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                  className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200"
                  placeholder="Streamable HTTP/SSE URL"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-zinc-700">Headers</label>
                  <button
                    onClick={addHeader}
                    className="p-1 text-zinc-400 hover:text-zinc-600"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {(form.headers || []).length === 0 ? (
                    <p className="text-xs text-zinc-400 py-2">No headers added yet</p>
                  ) : (
                    (form.headers || []).map((h, i) => (
                      <KeyValueRow
                        key={i}
                        pair={h}
                        onChange={(p) => updateHeader(i, p)}
                        onRemove={() => removeHeader(i)}
                        showGlobe
                      />
                    ))
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-zinc-700">Environment Variables</label>
                  <button
                    onClick={addEnvVar}
                    className="p-1 text-zinc-400 hover:text-zinc-600"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {(form.envVars || []).length === 0 ? (
                    <p className="text-xs text-zinc-400 py-2">No environment variables added</p>
                  ) : (
                    (form.envVars || []).map((ev, i) => (
                      <KeyValueRow
                        key={i}
                        pair={ev}
                        onChange={(p) => updateEnvVar(i, p)}
                        onRemove={() => removeEnvVar(i)}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-zinc-100 bg-white rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-zinc-600 hover:bg-zinc-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={mode !== "json" && !form.name.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-700 transition-colors disabled:opacity-40"
          >
            {template ? "Save Changes" : "Add Server"}
          </button>
        </div>
      </div>
    </div>
  )
}
