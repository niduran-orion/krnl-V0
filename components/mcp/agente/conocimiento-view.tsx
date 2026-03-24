"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Eye,
  CheckSquare,
  Square,
} from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────────

interface Collection {
  id: string
  name: string
  description: string
  sources: number
}

// ── Mock data ─────────────────────────────────────────────────────────────

const mockCollections: Collection[] = [
  {
    id: "col-1",
    name: "Documentación Interna",
    description: "Manuales y guías internas de la empresa",
    sources: 45,
  },
  {
    id: "col-2",
    name: "Base de Conocimiento Soporte",
    description: "Artículos y respuestas frecuentes de soporte",
    sources: 128,
  },
  {
    id: "col-3",
    name: "Políticas y Procedimientos",
    description: "Documentos de RRHH y políticas corporativas",
    sources: 23,
  },
  {
    id: "col-4",
    name: "Catálogo de Productos",
    description: "Especificaciones y fichas técnicas de productos",
    sources: 67,
  },
]

// ── Stepper ───────────────────────────────────────────────────────────────

const steps = [
  { number: 1, label: "Objetivo",           description: "Define el propósito, rol y modelo principal del agente." },
  { number: 2, label: "Conocimiento",        description: "Agrega fuentes de información. Sin colecciones, el agente responderá solo con el modelo base." },
  { number: 3, label: "Herramientas",        description: "Habilita acciones e integraciones. Sin herramientas, el agente solo responde dentro del chat." },
  { number: 4, label: "Parámetros del modelo", description: "Ajusta creatividad y longitud de respuestas. Si no cambias nada, se aplican valores por defecto." },
  { number: 5, label: "Publicar",            description: "Define dónde y para quién estará disponible el agente." },
]

const ACTIVE_STEP = 2

function Stepper() {
  return (
    <div className="flex items-start gap-0 mb-8">
      {steps.map((step, i) => {
        const isDone = step.number < ACTIVE_STEP
        const isActive = step.number === ACTIVE_STEP
        const isLast = i === steps.length - 1

        return (
          <div key={step.number} className="flex items-start flex-1 min-w-0">
            {/* Step */}
            <div className="flex flex-col items-center flex-1 min-w-0 px-1">
              {/* Circle + line row */}
              <div className="flex items-center w-full">
                {/* Circle */}
                <div
                  className="h-8 w-8 rounded-full shrink-0 flex items-center justify-center text-sm font-semibold relative z-10"
                  style={
                    isActive
                      ? { background: "#0F2870", color: "#FFFFFF", border: "2px solid #0F2870" }
                      : isDone
                      ? { background: "#D4009A", color: "#FFFFFF", border: "2px solid #D4009A" }
                      : { background: "#FFFFFF", color: "#919EAB", border: "2px solid #E9ECEE" }
                  }
                >
                  {isDone ? (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </div>

                {/* Connector line */}
                {!isLast && (
                  <div
                    className="flex-1 h-0.5 mx-1"
                    style={{
                      background: isDone ? "#D4009A" : "#E9ECEE",
                    }}
                  />
                )}
              </div>

              {/* Label */}
              <p
                className="text-xs font-semibold mt-2 text-center leading-tight"
                style={{ color: isActive ? "#1C2434" : isDone ? "#D4009A" : "#919EAB" }}
              >
                {step.label}
              </p>

              {/* Description — only active */}
              {isActive && (
                <p className="text-[11px] text-center leading-snug mt-1 hidden md:block" style={{ color: "#637381" }}>
                  {step.description}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────

export function ConocimientoView() {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [instructions, setInstructions] = useState("")

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="flex flex-col min-h-full" style={{ background: "#F7F8FA" }}>

      {/* ── Scrollable content ── */}
      <div className="flex-1 px-8 pt-6 pb-32">

        {/* Back link */}
        <Link
          href="#"
          className="inline-flex items-center gap-1.5 text-sm font-medium mb-5 transition-colors"
          style={{ color: "#0F2870" }}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Agentes
        </Link>

        {/* Page title */}
        <h1 className="text-2xl font-bold mb-0.5" style={{ color: "#1C2434" }}>
          Crear nuevo agente
        </h1>
        <p className="text-sm mb-6" style={{ color: "#637381" }}>
          Configura tu agente en 5 pasos simples
        </p>

        {/* Stepper */}
        <Stepper />

        {/* ── Collections card ── */}
        <div
          className="bg-white rounded-2xl border p-6 mb-4"
          style={{ borderColor: "#E9ECEE" }}
        >
          <h2 className="text-base font-semibold mb-0.5" style={{ color: "#1C2434" }}>
            Conocimiento del agente
          </h2>
          <p className="text-sm mb-5" style={{ color: "#919EAB" }}>
            Selecciona las colecciones que el agente podrá consultar
          </p>

          <div className="space-y-3">
            {mockCollections.map((col) => {
              const isChecked = selected.has(col.id)
              return (
                <button
                  key={col.id}
                  onClick={() => toggle(col.id)}
                  className="w-full flex items-start gap-4 rounded-xl border px-5 py-4 text-left transition-all"
                  style={
                    isChecked
                      ? { borderColor: "#D4009A", background: "#FFF0FA" }
                      : { borderColor: "#E9ECEE", background: "#FFFFFF" }
                  }
                >
                  {/* Checkbox */}
                  <div className="mt-0.5 shrink-0">
                    {isChecked ? (
                      <CheckSquare
                        className="h-5 w-5"
                        style={{ color: "#D4009A" }}
                      />
                    ) : (
                      <Square
                        className="h-5 w-5"
                        style={{ color: "#C4CDD5" }}
                      />
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "#1C2434" }}>
                      {col.name}
                    </p>
                    <p className="text-sm mt-0.5" style={{ color: "#637381" }}>
                      {col.description}
                    </p>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium transition-colors"
                      style={{ color: "#0891B2" }}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Ver {col.sources} fuentes
                    </button>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Create new collection link */}
          <button
            className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl border border-dashed py-3.5 text-sm font-medium transition-colors"
            style={{ borderColor: "#C4CDD5", color: "#637381" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#0F2870"
              e.currentTarget.style.color = "#0F2870"
              e.currentTarget.style.background = "#F4F6F8"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#C4CDD5"
              e.currentTarget.style.color = "#637381"
              e.currentTarget.style.background = ""
            }}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            Crear nueva colección
          </button>
        </div>

        {/* ── Instructions card ── */}
        <div
          className="bg-white rounded-2xl border p-6"
          style={{ borderColor: "#E9ECEE" }}
        >
          <h2 className="text-base font-semibold mb-0.5" style={{ color: "#1C2434" }}>
            Instrucciones de conocimiento
          </h2>
          <p className="text-sm mb-4" style={{ color: "#919EAB" }}>
            Indica al agente cómo debe utilizar las fuentes seleccionadas.
          </p>

          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Describe tus fuentes de conocimiento seleccionadas: qué contienen, cuándo deben consultarse y qué tipo de respuestas deben priorizar..."
            rows={5}
            className="w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none transition-all leading-relaxed"
            style={{
              borderColor: "#E9ECEE",
              background: "#F7F8FA",
              color: "#1C2434",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#0F2870"
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(15, 40, 112, 0.08)"
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#E9ECEE"
              e.currentTarget.style.boxShadow = ""
            }}
          />

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs" style={{ color: "#C4CDD5" }}>
              {instructions.length} caracteres
            </span>
            {instructions.length > 0 && (
              <button
                onClick={() => setInstructions("")}
                className="text-xs font-medium transition-colors"
                style={{ color: "#919EAB" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#454F5B")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#919EAB")}
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Sticky bottom bar ── */}
      <div
        className="fixed bottom-0 left-[240px] right-0 flex items-center justify-between px-8 py-4 border-t z-20"
        style={{ background: "#FFFFFF", borderColor: "rgba(145, 158, 171, 0.2)" }}
      >
        <Link
          href="#"
          className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
          style={{ color: "#637381" }}
        >
          <ArrowLeft className="h-4 w-4" />
          Anterior
        </Link>

        <div className="flex items-center gap-3">
          {/* Guardar borrador */}
          <button
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors"
            style={{ borderColor: "#E9ECEE", color: "#454F5B", background: "#FFFFFF" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F4F6F8")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
            Guardar borrador
          </button>

          {/* Continuar */}
          <Link
            href="/agente/herramientas"
            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors"
            style={{ background: "#D4009A" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#A4097B")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#D4009A")}
          >
            Continuar
          </Link>
        </div>
      </div>
    </div>
  )
}
