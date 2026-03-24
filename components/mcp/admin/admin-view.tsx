"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, Settings2, BookTemplate, Eye } from "lucide-react"
import { useMCPStore } from "@/lib/use-mcp-store"
import type { MCPTemplate } from "@/lib/mcp-data"
import { TransportBadge } from "../transport-badge"
import { StatusBadge } from "../status-badge"
import { TemplateModal } from "./template-modal"

export function AdminView() {
  const { templates, addTemplate, updateTemplate, deleteTemplate, instances } =
    useMCPStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<MCPTemplate | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const openNew = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (t: MCPTemplate) => {
    setEditing(t)
    setModalOpen(true)
  }

  const handleSave = (t: MCPTemplate) => {
    if (editing) {
      updateTemplate(t)
    } else {
      addTemplate(t)
    }
  }

  const handleDelete = (id: string) => {
    deleteTemplate(id)
    setDeleteConfirm(null)
  }

  const getInstanceCount = (templateId: string) =>
    instances.filter((i) => i.templateId === templateId).length

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <Settings2 className="h-5 w-5 text-[#1B3A6E]" />
            <h1 className="text-xl font-semibold text-[#1B2A3B]">Catálogo de Templates MCP</h1>
          </div>
          <p className="text-sm text-slate-500">
            Gestiona el catálogo global de plantillas para servidores MCP.
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-[#D4009A] text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-[#A4097B] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Agregar template
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-5 mb-8">
        {[
          {
            label: "TEMPLATES",
            value: templates.length,
            sub: "disponibles",
          },
          {
            label: "ACTIVOS",
            value: templates.filter((t) => t.status === "active").length,
            sub: "en uso",
          },
          {
            label: "INSTANCIAS",
            value: instances.length,
            sub: "configuradas",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white border border-slate-200 rounded-xl px-5 py-4"
          >
            <p className="text-[11px] font-semibold tracking-wider text-slate-400 mb-1">
              {s.label}
            </p>
            <p className="text-3xl font-semibold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <BookTemplate className="h-4 w-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-800">
              Templates disponibles
            </h2>
          </div>
          <span className="text-xs text-slate-400">{templates.length} items</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 w-[30%]">
                Integración
              </th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Tipo
              </th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Configuración
              </th>
              <th className="text-center px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Variables
              </th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Estado
              </th>
              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-right">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {templates.map((t) => (
              <tr
                key={t.id}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors group"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <Settings2 className="h-4 w-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{t.name}</p>
                      <p className="text-xs text-slate-400 line-clamp-1 max-w-[220px]">
                        {t.description}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <TransportBadge transport={t.transport} />
                </td>
                <td className="px-5 py-4">
                  <div className="text-xs text-slate-600 font-mono truncate max-w-[180px]">
                    {t.transportMode === "stdio" ? (
                      <span title={`${t.command} ${(t.args || []).join(" ")}`}>
                        {t.command} {(t.args || []).slice(0, 2).join(" ")}
                        {(t.args || []).length > 2 && "..."}
                      </span>
                    ) : t.transportMode === "http" ? (
                      <span title={t.url || ""}>
                        {t.url?.replace(/^https?:\/\//, "").slice(0, 25)}
                        {(t.url?.length || 0) > 25 && "..."}
                      </span>
                    ) : (
                      <span className="text-slate-400">JSON config</span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4 text-center">
                  <span className="inline-flex items-center justify-center h-6 min-w-[24px] px-1 rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                    {(t.envVars || []).length}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <StatusBadge status={t.status} />
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1 justify-end">
                    <button
                      onClick={() => openEdit(t)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors"
                    >
                      Configurar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Template Modal */}
      <TemplateModal
        open={modalOpen}
        template={editing}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="relative bg-white rounded-xl shadow-xl border border-slate-200 p-6 w-96">
            <h3 className="font-semibold text-slate-900 mb-2">Eliminar plantilla</h3>
            <p className="text-sm text-slate-500 mb-5">
              Esta acción eliminará la plantilla y no podrá deshacerse. ¿Continuar?
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
