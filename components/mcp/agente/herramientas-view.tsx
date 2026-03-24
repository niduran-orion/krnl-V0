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
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  BookOpen,
  Wrench,
  Cpu,
  ShieldCheck,
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

// ── Right Panel ───────────────────────────────────────────────────────────

function RightPanel({ selectedTools }: { selectedTools: Set<string> }) {
  const activeTools = mockTools.filter((t) => selectedTools.has(t.id))

  return (
    <div className="flex flex-col gap-0 h-full overflow-y-auto" style={{ background: "#F7F8FA" }}>

      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-1.5 mb-1">
          <Wrench className="h-3.5 w-3.5" style={{ color: "#D4009A" }} />
          <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#637381" }}>
            Lo que construye el sistema
          </span>
        </div>
        <p className="text-sm font-bold" style={{ color: "#1C2434" }}>Agentes generados</p>
        <p className="text-xs leading-relaxed mt-1" style={{ color: "#637381" }}>
          KRNL genera agentes especializados según lo que configures en cada paso.
        </p>

        {/* Status pill */}
        <div
          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border"
          style={{ background: "#EFF6FF", borderColor: "#BFDBFE", color: "#1D4ED8" }}
        >
          <div className="h-1.5 w-1.5 rounded-full" style={{ background: "#3B82F6" }} />
          Configurando herramientas del agente.
        </div>
      </div>

      {/* Divider */}
      <div className="border-t mx-4 my-1" style={{ borderColor: "rgba(145,158,171,0.16)" }} />

      {/* Architecture diagram */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#637381" }}>
            Arquitectura
          </span>
          <div className="flex gap-1">
            <div className="h-2 w-2 rounded-full" style={{ background: "#E9ECEE" }} />
            <div className="h-2 w-4 rounded-full" style={{ background: "#0F2870" }} />
            <div className="h-2 w-2 rounded-full" style={{ background: "#E9ECEE" }} />
          </div>
        </div>

        {/* Guardrail node */}
        <div
          className="rounded-xl border px-4 py-3 mb-3 flex items-center justify-between"
          style={{ background: "#FFFFFF", borderColor: "#E9ECEE" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}
            >
              <ShieldCheck className="h-3.5 w-3.5" style={{ color: "#16A34A" }} />
            </div>
            <div>
              <p className="text-xs font-semibold" style={{ color: "#1C2434" }}>Guardrail</p>
              <p className="text-[10px]" style={{ color: "#637381" }}>Llama Guard 3</p>
            </div>
          </div>
          <CheckCircle2 className="h-4 w-4" style={{ color: "#16A34A" }} />
        </div>

        {/* Connector */}
        <div className="flex justify-center mb-2">
          <div className="w-px h-4" style={{ background: "#E9ECEE" }} />
        </div>

        {/* Agente principal node */}
        <div
          className="rounded-xl border px-4 py-3 mb-3 flex items-center justify-between"
          style={{ background: "#FFFFFF", borderColor: "#E9ECEE" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}
            >
              <Cpu className="h-3.5 w-3.5" style={{ color: "#1D4ED8" }} />
            </div>
            <div>
              <p className="text-xs font-semibold" style={{ color: "#1C2434" }}>Agente principal</p>
              <p className="text-[10px]" style={{ color: "#637381" }}>Pendiente de configurar</p>
            </div>
          </div>
          <CheckCircle2 className="h-4 w-4" style={{ color: "#3B82F6" }} />
        </div>

        {/* Connector fork */}
        <div className="flex justify-center mb-2">
          <div className="w-px h-4" style={{ background: "#E9ECEE" }} />
        </div>

        {/* Sub-agents row */}
        <div className="grid grid-cols-2 gap-2">
          {/* Ag. Conocimiento */}
          <div
            className="rounded-xl border px-3 py-3"
            style={{ background: "#FFFFFF", borderColor: "#E9ECEE" }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <div
                className="h-5 w-5 rounded flex items-center justify-center shrink-0"
                style={{ background: "#F0FDF4" }}
              >
                <BookOpen className="h-3 w-3" style={{ color: "#16A34A" }} />
              </div>
              <p className="text-[10px] font-semibold" style={{ color: "#1C2434" }}>Ag. Conocimiento</p>
            </div>
            <p className="text-[9px]" style={{ color: "#637381" }}>mxbai-embed-large</p>
            <div className="mt-1.5 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" style={{ color: "#16A34A" }} />
            </div>
          </div>

          {/* Ag. Herramientas — highlighted */}
          <div
            className="rounded-xl border px-3 py-3"
            style={{ background: "#0F2870", borderColor: "#0F2870" }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <div
                className="h-5 w-5 rounded flex items-center justify-center shrink-0"
                style={{ background: "rgba(255,255,255,0.15)" }}
              >
                <Wrench className="h-3 w-3 text-white" />
              </div>
              <p className="text-[10px] font-semibold text-white">Ag. Herramientas</p>
            </div>
            <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.7)" }}>Hereda modelo principal</p>
            <div className="mt-1.5 flex items-center gap-1">
              <span
                className="text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: "#D4009A", color: "#FFFFFF" }}
              >
                ACTIVO
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t mx-4" style={{ borderColor: "rgba(145,158,171,0.16)" }} />

      {/* CONFIGURACIÓN section */}
      <div className="px-5 py-4">
        <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#637381" }}>
          Configuración
        </span>

        {/* Colecciones configuradas */}
        <div
          className="mt-3 rounded-xl border p-3"
          style={{ background: "#FFFFFF", borderColor: "#E9ECEE" }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" style={{ color: "#637381" }} />
              <span className="text-xs font-semibold" style={{ color: "#1C2434" }}>Colecciones configuradas</span>
            </div>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: "#F4F6F8", color: "#637381" }}
            >
              1
            </span>
          </div>
          <div
            className="flex items-center justify-between rounded-lg px-3 py-2"
            style={{ background: "#F7F8FA", border: "1px solid #E9ECEE" }}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="h-3.5 w-3.5" style={{ color: "#637381" }} />
              <div>
                <p className="text-[11px] font-medium" style={{ color: "#1C2434" }}>Colecciones configuradas</p>
                <p className="text-[10px]" style={{ color: "#919EAB" }}>45 fuentes</p>
              </div>
            </div>
            <CheckCircle2 className="h-4 w-4" style={{ color: "#16A34A" }} />
          </div>
        </div>

        {/* Herramientas activadas */}
        <div
          className="mt-3 rounded-xl border p-3"
          style={{ background: "#FFFFFF", borderColor: "#E9ECEE" }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4" style={{ color: "#637381" }} />
              <span className="text-xs font-semibold" style={{ color: "#1C2434" }}>Herramientas activadas</span>
            </div>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: "#F4F6F8", color: "#637381" }}
            >
              {activeTools.length}
            </span>
          </div>

          {activeTools.length === 0 ? (
            <div
              className="flex items-center justify-center rounded-lg px-3 py-3 text-xs"
              style={{ background: "#F7F8FA", border: "1px solid #E9ECEE", color: "#919EAB" }}
            >
              Ninguna herramienta seleccionada
            </div>
          ) : (
            <div className="space-y-1.5">
              {activeTools.map((tool) => {
                const Icon = tool.icon
                return (
                  <div
                    key={tool.id}
                    className="flex items-center justify-between rounded-lg px-3 py-2"
                    style={{ background: "#F7F8FA", border: "1px solid #E9ECEE" }}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5" style={{ color: "#637381" }} />
                      <p className="text-[11px] font-medium" style={{ color: "#1C2434" }}>
                        {tool.name}
                      </p>
                    </div>
                    <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "#16A34A" }} />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Instrucciones de herramientas */}
        <div
          className="mt-3 rounded-xl border p-3"
          style={{ background: "#FFFFFF", borderColor: "#E9ECEE" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Wrench className="h-4 w-4" style={{ color: "#637381" }} />
            <span className="text-xs font-semibold" style={{ color: "#1C2434" }}>Config. del agente de herramientas</span>
          </div>
          <InstructionsBox />
        </div>

        <p className="text-[10px] text-center mt-4" style={{ color: "#919EAB" }}>
          Solo los agentes configurados estarán activos
        </p>
      </div>
    </div>
  )
}

// ── Instructions Box (reusable inside right panel) ────────────────────────

function InstructionsBox() {
  const [instructions, setInstructions] = useState("")

  return (
    <div>
      <textarea
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        placeholder="Describe cómo deben usarse las herramientas: en qué situaciones activarlas, qué prioridad tienen entre sí y qué limitaciones deben respetar..."
        rows={4}
        className="w-full resize-none rounded-lg border px-3 py-2 text-xs outline-none transition-all leading-relaxed"
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
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[10px]" style={{ color: "#C4CDD5" }}>
          {instructions.length} caracteres
        </span>
        {instructions.length > 0 && (
          <button
            onClick={() => setInstructions("")}
            className="text-[10px] font-medium transition-colors"
            style={{ color: "#919EAB" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#454F5B")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#919EAB")}
          >
            Limpiar
          </button>
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────

export function HerramientasView() {
  const [selected, setSelected]         = useState<Set<string>>(new Set(["tool-email"]))
  const [instructions, setInstructions] = useState("")
  const [panelOpen, setPanelOpen]       = useState(true)

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="flex h-full" style={{ background: "#F7F8FA" }}>

      {/* ── Left: main content ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-y-auto pb-24">
        <div className="px-8 pt-6">

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
      </div>

      {/* ── Panel toggle button ── */}
      <button
        onClick={() => setPanelOpen(!panelOpen)}
        className="self-start mt-6 -mr-0 flex items-center justify-center h-7 w-5 rounded-l-lg border border-r-0 transition-colors shrink-0 z-10"
        style={{
          background: "#FFFFFF",
          borderColor: "rgba(145,158,171,0.2)",
          color: "#637381",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#F4F6F8")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
        aria-label={panelOpen ? "Cerrar panel" : "Abrir panel"}
      >
        {panelOpen ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>

      {/* ── Right panel ── */}
      {panelOpen && (
        <aside
          className="w-[280px] shrink-0 border-l overflow-y-auto"
          style={{
            background: "#F7F8FA",
            borderColor: "rgba(145,158,171,0.2)",
          }}
        >
          <RightPanel selectedTools={selected} />
        </aside>
      )}

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
