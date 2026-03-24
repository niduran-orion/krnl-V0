"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Mail,
  Search,
  Ticket,
  FileSearch,
  Globe,
  Database,
  Zap,
  GitPullRequest,
} from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────────

interface Tool {
  id: string
  name: string
  description: string
  icon: React.ElementType
}

// ── Mock data ─────────────────────────────────────────────────────────────

const mockTools: Tool[] = [
  {
    id: "tool-email",
    name: "Enviar email",
    description: "Permite al agente enviar correos electrónicos",
    icon: Mail,
  },
  {
    id: "tool-crm",
    name: "Buscar en CRM",
    description: "Consulta información de clientes en Salesforce",
    icon: Search,
  },
  {
    id: "tool-ticket",
    name: "Crear ticket",
    description: "Crea tickets en sistema de soporte",
    icon: Ticket,
  },
  {
    id: "tool-docs",
    name: "Buscar documentos",
    description: "Busca en todas las colecciones conectadas",
    icon: FileSearch,
  },
  {
    id: "tool-web",
    name: "Buscar en internet",
    description: "Realiza búsquedas en la web en tiempo real",
    icon: Globe,
  },
  {
    id: "tool-db",
    name: "Consultar base de datos",
    description: "Ejecuta consultas SQL sobre bases de datos conectadas",
    icon: Database,
  },
  {
    id: "tool-webhook",
    name: "Disparar webhook",
    description: "Envía eventos a sistemas externos vía HTTP",
    icon: Zap,
  },
  {
    id: "tool-pr",
    name: "Crear Pull Request",
    description: "Abre pull requests en repositorios de GitHub",
    icon: GitPullRequest,
  },
]

// ── Stepper ───────────────────────────────────────────────────────────────

const steps = [
  { number: 1, label: "Objetivo",             description: "Define el propósito, rol y modelo principal del agente." },
  { number: 2, label: "Conocimiento",          description: "Agrega fuentes de información. Sin colecciones, el agente responderá solo con el modelo base." },
  { number: 3, label: "Herramientas",          description: "Habilita acciones e integraciones. Sin herramientas, el agente solo responde dentro del chat." },
  { number: 4, label: "Parámetros del modelo", description: "Ajusta creatividad y longitud de respuestas. Si no cambias nada, se aplican valores por defecto." },
  { number: 5, label: "Publicar",              description: "Define dónde y para quién estará disponible el agente." },
]

const ACTIVE_STEP = 3

function Stepper() {
  return (
    <div className="flex items-start gap-0 mb-8">
      {steps.map((step, i) => {
        const isDone   = step.number < ACTIVE_STEP
        const isActive = step.number === ACTIVE_STEP
        const isLast   = i === steps.length - 1

        return (
          <div key={step.number} className="flex items-start flex-1 min-w-0">
            <div className="flex flex-col items-center flex-1 min-w-0 px-1">
              {/* Circle + connector */}
              <div className="flex items-center w-full">
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
                {!isLast && (
                  <div
                    className="flex-1 h-0.5 mx-1"
                    style={{ background: isDone ? "#D4009A" : "#E9ECEE" }}
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

              {/* Description — active step only */}
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

export function HerramientasView() {
  const [selected, setSelected]         = useState<Set<string>>(new Set(["tool-email"]))
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
          href="/agente/conocimiento"
          className="inline-flex items-center gap-1.5 text-sm font-medium mb-5 transition-colors"
          style={{ color: "#0F2870" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#D4009A")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#0F2870")}
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

        {/* ── Tools card ── */}
        <div
          className="bg-white rounded-2xl border p-6 mb-4"
          style={{ borderColor: "#E9ECEE" }}
        >
          <h2 className="text-base font-semibold mb-0.5" style={{ color: "#1C2434" }}>
            Herramientas del agente
          </h2>
          <p className="text-sm mb-5" style={{ color: "#919EAB" }}>
            Selecciona qué acciones puede realizar el agente
          </p>

          <div className="space-y-3">
            {mockTools.map((tool) => {
              const isChecked = selected.has(tool.id)
              const Icon = tool.icon
              return (
                <button
                  key={tool.id}
                  onClick={() => toggle(tool.id)}
                  className="w-full flex items-center gap-4 rounded-xl border px-5 py-4 text-left transition-all"
                  style={
                    isChecked
                      ? { borderColor: "#D4009A", background: "#FFF0FA" }
                      : { borderColor: "#E9ECEE", background: "#FFFFFF" }
                  }
                  onMouseEnter={(e) => {
                    if (!isChecked) e.currentTarget.style.borderColor = "#C4CDD5"
                  }}
                  onMouseLeave={(e) => {
                    if (!isChecked) e.currentTarget.style.borderColor = "#E9ECEE"
                  }}
                >
                  {/* Checkbox */}
                  <div className="shrink-0">
                    <div
                      className="h-5 w-5 rounded flex items-center justify-center"
                      style={
                        isChecked
                          ? { background: "#D4009A", border: "2px solid #D4009A" }
                          : { background: "#FFFFFF", border: "2px solid #C4CDD5" }
                      }
                    >
                      {isChecked && (
                        <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Icon */}
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                    style={
                      isChecked
                        ? { background: "#FDEBF6" }
                        : { background: "#F4F6F8" }
                    }
                  >
                    <Icon
                      className="h-4 w-4"
                      style={{ color: isChecked ? "#D4009A" : "#637381" }}
                    />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "#1C2434" }}>
                      {tool.name}
                    </p>
                    <p className="text-sm mt-0.5" style={{ color: "#637381" }}>
                      {tool.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Instructions card ── */}
        <div
          className="bg-white rounded-2xl border p-6"
          style={{ borderColor: "#E9ECEE" }}
        >
          <h2 className="text-base font-semibold mb-0.5" style={{ color: "#1C2434" }}>
            Instrucciones de herramientas
          </h2>
          <p className="text-sm mb-4" style={{ color: "#919EAB" }}>
            Indica al agente cuándo y cómo debe utilizar las herramientas seleccionadas.
          </p>

          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Describe cómo deben usarse las herramientas seleccionadas: en qué situaciones activarlas, qué prioridad tienen entre sí y qué limitaciones deben respetar..."
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
          href="/agente/conocimiento"
          className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
          style={{ color: "#637381" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#1C2434")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#637381")}
        >
          <ArrowLeft className="h-4 w-4" />
          Anterior
        </Link>

        <div className="flex items-center gap-3">
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

          <button
            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors"
            style={{ background: "#D4009A" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#A4097B")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#D4009A")}
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  )
}
