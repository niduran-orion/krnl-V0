"use client"

import { useState } from "react"
import {
  CheckCircle2,
  Settings,
  Pencil,
  Trash2,
  Info,
  Plug2,
  Users,
  X,
  Terminal,
  Globe,
  Plus,
  Eye,
} from "lucide-react"
import { useMCPStore } from "@/lib/use-mcp-store"
import type { MCPTemplate, MCPInstance } from "@/lib/mcp-data"
import { mockAreas } from "@/lib/mcp-data"
import { TransportBadge } from "../transport-badge"
import { StatusBadge } from "../status-badge"
import { InstanceModal } from "./instance-modal"

function InstanceDetailSlide({
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
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-base font-semibold text-slate-900">{instance.name}</p>
            <p className="text-sm text-slate-500">{template.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Transport config */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              {template.transportMode === "stdio" ? <Terminal className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
              Configuración
            </p>
            {template.transportMode === "http" && (
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-slate-600 mb-1.5">URL</p>
                  <p className="text-sm font-mono text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 break-all">
                    {instance.urlOverride || template.url}
                  </p>
                </div>
                {(template.headers || []).length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-600 mb-1.5">Headers</p>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 space-y-1">
                      {template.headers!.map((h, i) => (
                        <p key={i} className="text-sm font-mono text-slate-600">
                          <span className="text-slate-800">{h.key}:</span> {h.value}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {template.transportMode === "stdio" && (
              <div>
                <p className="text-xs font-medium text-slate-600 mb-1.5">Comando</p>
                <p className="text-sm font-mono text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 break-all">
                  {template.command} {(instance.argsOverride || template.args || []).join(" ")}
                </p>
              </div>
            )}
          </div>

          {/* Env values */}
          {Object.keys(instance.envValues).length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Variables de entorno
              </p>
              <div className="space-y-3">
                {Object.entries(instance.envValues).map(([k, v]) => (
                  <div key={k}>
                    <p className="text-xs font-medium text-slate-600 mb-1.5">{k}</p>
                    <p className="text-sm font-mono text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                      {v.startsWith("••") ? v : "••••••••"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Información
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-lg divide-y divide-slate-200">
              <div className="flex justify-between items-center px-4 py-3">
                <span className="text-sm text-slate-500">Área</span>
                <span className="text-sm font-medium text-slate-800">{area?.name}</span>
              </div>
              <div className="flex justify-between items-center px-4 py-3">
                <span className="text-sm text-slate-500">Estado</span>
                <StatusBadge status={instance.status} />
              </div>
              <div className="flex justify-between items-center px-4 py-3">
                <span className="text-sm text-slate-500">Creada</span>
                <span className="text-sm font-medium text-slate-800">{instance.createdAt}</span>
              </div>
              <div className="flex justify-between items-center px-4 py-3">
                <span className="text-sm text-slate-500">Transporte</span>
                <TransportBadge transport={template.transport} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ManagerView() {
  const { templates, instances, currentUser, addInstance, updateInstance, deleteInstance } =
    useMCPStore()

  const [selectedTemplate, setSelectedTemplate] = useState<MCPTemplate | null>(null)
  const [editingInstance, setEditingInstance] = useState<MCPInstance | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [detailInstance, setDetailInstance] = useState<MCPInstance | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [instructions, setInstructions] = useState("")

  const myAreaInstances = instances.filter((i) => i.areaId === currentUser.areaId)

  const openConfigure = (template: MCPTemplate, existing?: MCPInstance) => {
    setSelectedTemplate(template)
    setEditingInstance(existing ?? null)
    setModalOpen(true)
  }

  const getMyInstance = (templateId: string) =>
    myAreaInstances.find((i) => i.templateId === templateId)

  const handleSave = (inst: MCPInstance) => {
    if (editingInstance) {
      updateInstance(inst)
    } else {
      addInstance(inst)
    }
  }

  const handleDelete = (id: string) => {
    deleteInstance(id)
    setDeleteConfirm(null)
    if (detailInstance?.id === id) setDetailInstance(null)
  }

  const getConfigSummary = (inst: MCPInstance, tpl: MCPTemplate): string => {
    if (tpl.transportMode === "http") {
      return inst.urlOverride || tpl.url || ""
    }
    if (tpl.transportMode === "stdio") {
      const args = inst.argsOverride || tpl.args || []
      return `${tpl.command} ${args.slice(0, 2).join(" ")}${args.length > 2 ? "..." : ""}`
    }
    return "JSON config"
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <Plug2 className="h-5 w-5 text-[#0F2870]" />
            <h1 className="text-xl font-semibold text-[#1C2434]">Configurar Instancias</h1>
          </div>
          <p className="text-sm text-[#637381]">
            Configura servidores MCP con credenciales y asígnalos a tu área.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-5 mb-8">
        {[
          { label: "DISPONIBLES", value: templates.filter((t) => t.status === "active").length, sub: "templates" },
          { label: "CONFIGURADOS", value: myAreaInstances.filter((i) => i.status === "active").length, sub: "activos" },
          {
            label: "MI ÁREA",
            value: mockAreas.find((a) => a.id === currentUser.areaId)?.name ?? "—",
            sub: `${mockAreas.find((a) => a.id === currentUser.areaId)?.memberCount} miembros`,
          },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-[#E9ECEE] rounded-xl px-5 py-4">
            <p className="text-[11px] font-semibold tracking-wider text-[#919EAB] mb-1">
              {s.label}
            </p>
            <p className="text-3xl font-semibold text-[#1C2434]">{s.value}</p>
            <p className="text-xs text-[#637381] mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Template catalog cards */}
      <div className="bg-white border border-[#E9ECEE] rounded-xl overflow-hidden shadow-sm mb-8">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E9ECEE]">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-[#637381]" />
            <h2 className="text-sm font-semibold text-[#1C2434]">
              Catálogo de integraciones disponibles
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 p-5 lg:grid-cols-3">
          {templates
            .filter((t) => t.status === "active")
            .map((t) => {
              const inst = getMyInstance(t.id)
              return (
                <div
                  key={t.id}
                  className="border border-[#E9ECEE] rounded-xl p-4 flex flex-col gap-3 relative hover:border-[#C4CDD5] transition-colors"
                >
                  {inst && (
                    <span className="absolute top-3 right-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    </span>
                  )}
                  <div className="flex items-start gap-3 pr-6">
                    <div className="h-9 w-9 rounded-lg bg-[#F4F6F8] flex items-center justify-center shrink-0">
                      {t.transportMode === "stdio" ? (
                        <Terminal className="h-4 w-4 text-[#637381]" />
                      ) : (
                        <Globe className="h-4 w-4 text-[#637381]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1C2434]">{t.name}</p>
                      <p className="text-xs text-[#919EAB] line-clamp-2 mt-0.5 leading-relaxed">
                        {t.description}
                      </p>
                    </div>
                  </div>
                  <TransportBadge transport={t.transport} />
                  <button
                    onClick={() => openConfigure(t, inst)}
                    className={`w-full flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all ${
                      inst
                        ? "border border-[#E9ECEE] text-[#454F5B] hover:bg-[#F4F6F8]"
                        : "bg-[#D4009A] text-white hover:bg-[#A4097B]"
                    }`}
                  >
                    {inst ? (
                      <>
                        <Settings className="h-4 w-4" /> Editar
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" /> Configurar
                      </>
                    )}
                  </button>
                </div>
              )
            })}
        </div>
      </div>

      {/* My configured instances */}
      <div className="bg-white border border-[#E9ECEE] rounded-xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E9ECEE]">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#637381]" />
            <h2 className="text-sm font-semibold text-[#1C2434]">
              Mis integraciones configuradas
            </h2>
          </div>
          <span className="text-xs text-[#919EAB]">{myAreaInstances.length} items</span>
        </div>

        {myAreaInstances.length === 0 ? (
          <div className="p-12 text-center">
            <Plug2 className="h-10 w-10 text-[#C4CDD5] mx-auto mb-3" />
            <p className="text-sm font-medium text-[#637381]">Sin integraciones configuradas</p>
            <p className="text-xs text-[#919EAB] mt-1">
              Selecciona una plantilla del catálogo para comenzar.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E9ECEE]" style={{ background: "#F7F8FA" }}>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#919EAB]">
                  Integración
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#919EAB]">
                  Transporte
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#919EAB]">
                  Configuración
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#919EAB]">
                  Estado
                </th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#919EAB] text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {myAreaInstances.map((inst) => {
                const tpl = templates.find((t) => t.id === inst.templateId)
                if (!tpl) return null
                const configSummary = getConfigSummary(inst, tpl)
                return (
                  <tr
                    key={inst.id}
                    className="border-b border-[#E9ECEE] last:border-0 hover:bg-[#F7F8FA] transition-colors group"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-[#F4F6F8] flex items-center justify-center shrink-0">
                          {tpl.transportMode === "stdio" ? (
                            <Terminal className="h-4 w-4 text-[#637381]" />
                          ) : (
                            <Globe className="h-4 w-4 text-[#637381]" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-[#1C2434]">{inst.name}</p>
                          <p className="text-xs text-[#919EAB]">{tpl.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <TransportBadge transport={tpl.transport} />
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-xs text-[#637381] font-mono truncate max-w-[200px]" title={configSummary}>
                        {configSummary.replace(/^https?:\/\//, "").slice(0, 30)}
                        {configSummary.length > 30 && "..."}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={inst.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => setDetailInstance(inst)}
                          className="p-2 rounded-lg hover:bg-[#F4F6F8] text-[#919EAB] hover:text-[#454F5B] transition-colors"
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openConfigure(tpl, inst)}
                          className="p-2 rounded-lg hover:bg-[#F4F6F8] text-[#919EAB] hover:text-[#454F5B] transition-colors"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(inst.id)}
                          className="p-2 rounded-lg hover:bg-red-50 text-[#919EAB] hover:text-red-500 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-white border border-[#E9ECEE] rounded-xl overflow-hidden shadow-sm">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-[#E9ECEE]">
          <Info className="h-4 w-4 text-[#637381]" />
          <h2 className="text-sm font-semibold text-[#212B36]">Instrucciones de conocimiento</h2>
        </div>
        <div className="p-5">
          <p className="text-xs text-[#637381] mb-3">
            Describe cómo deben utilizarse las fuentes de conocimiento seleccionadas en esta integración.
          </p>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Describe tus fuentes de conocimiento seleccionadas: qué contienen, cuándo deben consultarse, qué tipo de respuestas deben priorizar..."
            rows={5}
            className="w-full resize-none rounded-lg border border-[#E9ECEE] bg-[#F7F8FA] px-4 py-3 text-sm text-[#212B36] placeholder:text-[#919EAB] outline-none focus:border-[#0F2870] focus:ring-2 focus:ring-[#0F2870]/10 transition-all leading-relaxed"
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-[#919EAB]">
              {instructions.length} caracteres
            </span>
            <button
              onClick={() => setInstructions("")}
              className={`text-xs font-medium transition-colors ${
                instructions.length > 0
                  ? "text-[#637381] hover:text-[#212B36]"
                  : "text-[#C4CDD5] cursor-default"
              }`}
              disabled={instructions.length === 0}
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedTemplate && (
        <InstanceModal
          open={modalOpen}
          template={selectedTemplate}
          instance={editingInstance}
          areas={mockAreas}
          defaultAreaId={currentUser.areaId}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}

      {detailInstance && (() => {
        const tpl = templates.find((t) => t.id === detailInstance.templateId)
        if (!tpl) return null
        return (
          <InstanceDetailSlide
            instance={detailInstance}
            template={tpl}
            onClose={() => setDetailInstance(null)}
          />
        )
      })()}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="relative bg-white rounded-xl shadow-xl border border-slate-200 p-6 w-96">
            <h3 className="font-semibold text-slate-900 mb-2">Eliminar integración</h3>
            <p className="text-sm text-slate-500 mb-5">
              Esta acción eliminará la instancia configurada. ¿Continuar?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
