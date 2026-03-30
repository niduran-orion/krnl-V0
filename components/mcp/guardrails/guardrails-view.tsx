"use client"

import { useState } from "react"
import {
  Shield,
  Plus,
  Search,
  Tag,
  ChevronRight,
  Copy,
  Pencil,
  Trash2,
  Clock,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  FlaskConical,
  X,
  ChevronDown,
  Zap,
  Eye,
  MoreHorizontal,
} from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────────────────

type PromptCategory = "Seguridad" | "Ética" | "Formato" | "Veracidad"

interface PromptVersion {
  version: string
  content: string
  createdAt: string
  author: string
}

interface PromptTemplate {
  id: string
  title: string
  description: string
  category: PromptCategory
  tags: string[]
  latestVersion: string
  versions: PromptVersion[]
  usedBy: number
  createdAt: string
}

interface GuardrailAgent {
  id: string
  name: string
  promptId: string
  model: string
  temperature: number
  status: "active" | "inactive" | "draft"
  usedInAgents: number
  createdAt: string
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const CATEGORY_COLOR: Record<PromptCategory, { bg: string; text: string; border: string }> = {
  Seguridad: { bg: "#FFF1F2", text: "#BE123C", border: "#FECDD3" },
  Ética:     { bg: "#FFF7ED", text: "#C2410C", border: "#FED7AA" },
  Formato:   { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
  Veracidad: { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0" },
}

const INITIAL_PROMPTS: PromptTemplate[] = [
  {
    id: "pt-001",
    title: "Filtro de Inyección SQL",
    description: "Detecta y bloquea intentos de inyección SQL en prompts de usuario antes de pasarlos al agente.",
    category: "Seguridad",
    tags: ["sql", "injection", "input-validation"],
    latestVersion: "v2.1",
    usedBy: 8,
    createdAt: "2024-12-01",
    versions: [
      {
        version: "v2.1",
        content: `Eres un guardrail de seguridad especializado en detectar inyecciones SQL.\n\nAnaliza el siguiente input de usuario y determina si contiene patrones de inyección SQL.\n\nInput: {{user_input}}\n\nResponde ONLY con JSON:\n{\n  "safe": true | false,\n  "confidence": 0-1,\n  "reason": "string"\n}`,
        createdAt: "2025-01-15",
        author: "Equipo Seguridad",
      },
      {
        version: "v2.0",
        content: `Detecta inyecciones SQL en: {{user_input}}\nResponde: { "safe": bool }`,
        createdAt: "2024-12-20",
        author: "Equipo Seguridad",
      },
    ],
  },
  {
    id: "pt-002",
    title: "Validador de Tono Corporativo",
    description: "Asegura que las respuestas del agente mantengan un tono profesional y alineado con la marca.",
    category: "Formato",
    tags: ["tone", "brand", "output"],
    latestVersion: "v1.3",
    usedBy: 12,
    createdAt: "2024-11-15",
    versions: [
      {
        version: "v1.3",
        content: `Eres un validador de tono corporativo.\n\nEvalúa si la siguiente respuesta mantiene un tono profesional, empático y alineado con los valores de la empresa.\n\nRespuesta a evaluar: {{agent_output}}\n\nResponde con JSON:\n{\n  "approved": true | false,\n  "tone_score": 0-10,\n  "issues": ["array de problemas si los hay"],\n  "suggestion": "string opcional"\n}`,
        createdAt: "2025-02-10",
        author: "Equipo Marketing",
      },
    ],
  },
  {
    id: "pt-003",
    title: "Detector de PII / Datos Sensibles",
    description: "Identifica y enmascara información personal identificable antes de procesar o responder.",
    category: "Ética",
    tags: ["pii", "gdpr", "privacy", "compliance"],
    latestVersion: "v3.0",
    usedBy: 15,
    createdAt: "2024-10-01",
    versions: [
      {
        version: "v3.0",
        content: `Eres un detector de PII (Información Personal Identificable).\n\nAnaliza el texto y detecta: nombres completos, DNI/RUT, emails, teléfonos, tarjetas de crédito, direcciones.\n\nTexto: {{input_text}}\n\nResponde con JSON:\n{\n  "has_pii": true | false,\n  "detected": [\n    { "type": "email|phone|id|name|address|credit_card", "value": "detectado", "masked": "enmascarado" }\n  ],\n  "clean_text": "texto con PII enmascarado"\n}`,
        createdAt: "2025-03-01",
        author: "Equipo Legal",
      },
    ],
  },
  {
    id: "pt-004",
    title: "Verificador de Veracidad / Anti-Alucinación",
    description: "Valida que las respuestas se basen en hechos verificables y no contengan alucinaciones.",
    category: "Veracidad",
    tags: ["hallucination", "grounding", "facts"],
    latestVersion: "v1.0",
    usedBy: 6,
    createdAt: "2025-01-10",
    versions: [
      {
        version: "v1.0",
        content: `Eres un verificador de veracidad para respuestas de IA.\n\nContexto disponible: {{context}}\nRespuesta del agente: {{agent_response}}\n\nEvalúa si la respuesta está fundamentada en el contexto proporcionado.\n\nResponde con JSON:\n{\n  "grounded": true | false,\n  "confidence": 0-1,\n  "unsupported_claims": ["claims sin soporte en contexto"],\n  "verdict": "PASS | WARN | FAIL"\n}`,
        createdAt: "2025-01-10",
        author: "Equipo ML",
      },
    ],
  },
]

const MODELS = [
  "gemini-1.5-flash",
  "llama-3-8b",
  "mistral-7b",
  "gpt-4o-mini",
  "claude-haiku",
  "gemini-2.0-flash",
]

const INITIAL_AGENTS: GuardrailAgent[] = [
  {
    id: "ga-001",
    name: "SQL Guard - Flash",
    promptId: "pt-001",
    model: "gemini-1.5-flash",
    temperature: 0,
    status: "active",
    usedInAgents: 4,
    createdAt: "2025-01-20",
  },
  {
    id: "ga-002",
    name: "Tono Corporativo - Mini",
    promptId: "pt-002",
    model: "gpt-4o-mini",
    temperature: 0.1,
    status: "active",
    usedInAgents: 7,
    createdAt: "2025-02-15",
  },
  {
    id: "ga-003",
    name: "PII Detector - Llama",
    promptId: "pt-003",
    model: "llama-3-8b",
    temperature: 0,
    status: "active",
    usedInAgents: 9,
    createdAt: "2025-03-05",
  },
  {
    id: "ga-004",
    name: "Anti-Alucinación - Draft",
    promptId: "pt-004",
    model: "mistral-7b",
    temperature: 0.2,
    status: "draft",
    usedInAgents: 0,
    createdAt: "2025-03-20",
  },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function CategoryBadge({ category }: { category: PromptCategory }) {
  const c = CATEGORY_COLOR[category]
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border"
      style={{ background: c.bg, color: c.text, borderColor: c.border }}
    >
      {category}
    </span>
  )
}

function StatusBadge({ status }: { status: GuardrailAgent["status"] }) {
  const map = {
    active:   { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0", label: "Activo" },
    inactive: { bg: "#F8FAFC", text: "#64748B", border: "#E2E8F0", label: "Inactivo" },
    draft:    { bg: "#FFF7ED", text: "#C2410C", border: "#FED7AA", label: "Borrador" },
  }
  const s = map[status]
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border"
      style={{ background: s.bg, color: s.text, borderColor: s.border }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.text }} />
      {s.label}
    </span>
  )
}

function TagChip({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono border"
      style={{ background: "#F8FAFC", color: "#475569", borderColor: "#E2E8F0" }}
    >
      <Tag className="h-2.5 w-2.5" />
      {label}
    </span>
  )
}

// ─── Prompt Detail Drawer ─────────────────────────────────────────────────────

function PromptDrawer({
  prompt,
  onClose,
}: {
  prompt: PromptTemplate
  onClose: () => void
}) {
  const [selectedVersion, setSelectedVersion] = useState(prompt.versions[0])
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(selectedVersion.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div
        className="w-[560px] h-full flex flex-col shadow-2xl"
        style={{ background: "#FFFFFF", borderLeft: "1px solid #E2E8F0" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b" style={{ borderColor: "#E2E8F0" }}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CategoryBadge category={prompt.category} />
              <span className="text-xs text-slate-400">{prompt.latestVersion}</span>
            </div>
            <h2 className="text-base font-semibold" style={{ color: "#1C2434" }}>{prompt.title}</h2>
            <p className="text-xs mt-0.5" style={{ color: "#637381" }}>{prompt.description}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        {/* Version selector */}
        <div className="px-6 py-3 border-b flex items-center gap-3" style={{ borderColor: "#E2E8F0", background: "#F8FAFC" }}>
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 mr-1">Versión:</span>
          <div className="flex gap-1.5">
            {prompt.versions.map((v) => (
              <button
                key={v.version}
                onClick={() => setSelectedVersion(v)}
                className="px-2.5 py-1 rounded-md text-xs font-medium border transition-colors"
                style={
                  selectedVersion.version === v.version
                    ? { background: "#0F2870", color: "#fff", borderColor: "#0F2870" }
                    : { background: "#fff", color: "#475569", borderColor: "#E2E8F0" }
                }
              >
                {v.version}
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs text-slate-400">{selectedVersion.author} · {selectedVersion.createdAt}</span>
        </div>

        {/* Prompt content */}
        <div className="flex-1 overflow-auto px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Contenido del prompt</span>
            <button
              onClick={copy}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border transition-colors"
              style={{ color: "#475569", borderColor: "#E2E8F0" }}
            >
              <Copy className="h-3 w-3" />
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
          <pre
            className="rounded-xl p-4 text-xs font-mono leading-relaxed whitespace-pre-wrap overflow-auto"
            style={{ background: "#0F1117", color: "#E2E8F0", minHeight: 200 }}
          >
            {selectedVersion.content}
          </pre>

          {/* Tags */}
          <div className="mt-5">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 block">Tags</span>
            <div className="flex flex-wrap gap-1.5">
              {prompt.tags.map((t) => <TagChip key={t} label={t} />)}
            </div>
          </div>

          {/* Usage */}
          <div
            className="mt-5 rounded-xl p-4 flex items-center gap-3 border"
            style={{ background: "#F8FAFC", borderColor: "#E2E8F0" }}
          >
            <Zap className="h-4 w-4 shrink-0" style={{ color: "#0F2870" }} />
            <div>
              <p className="text-xs font-medium" style={{ color: "#1C2434" }}>
                Usado en <strong>{prompt.usedBy}</strong> agentes guardrail activos
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Actualizar este prompt afectará a todos los agentes que lo usan. Crear una nueva versión es recomendable.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex gap-2" style={{ borderColor: "#E2E8F0" }}>
          <button
            className="flex-1 flex items-center justify-center gap-2 text-sm font-medium py-2.5 rounded-lg border transition-colors"
            style={{ borderColor: "#E2E8F0", color: "#475569" }}
          >
            <Pencil className="h-3.5 w-3.5" />
            Editar prompt
          </button>
          <button
            className="flex-1 flex items-center justify-center gap-2 text-sm font-medium py-2.5 rounded-lg text-white transition-colors"
            style={{ background: "#D4009A" }}
          >
            <FlaskConical className="h-3.5 w-3.5" />
            Probar en Playground
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── New Agent Modal ──────────────────────────────────────────────────────────

function NewAgentModal({
  prompts,
  onSave,
  onClose,
  editAgent,
}: {
  prompts: PromptTemplate[]
  onSave: (agent: GuardrailAgent) => void
  onClose: () => void
  editAgent: GuardrailAgent | null
}) {
  const [name, setName] = useState(editAgent?.name ?? "")
  const [promptId, setPromptId] = useState(editAgent?.promptId ?? prompts[0]?.id ?? "")
  const [model, setModel] = useState(editAgent?.model ?? MODELS[0])
  const [temperature, setTemperature] = useState(editAgent?.temperature ?? 0)
  const [status, setStatus] = useState<GuardrailAgent["status"]>(editAgent?.status ?? "draft")

  const save = () => {
    if (!name.trim()) return
    onSave({
      id: editAgent?.id ?? `ga-${Date.now()}`,
      name: name.trim(),
      promptId,
      model,
      temperature,
      status,
      usedInAgents: editAgent?.usedInAgents ?? 0,
      createdAt: editAgent?.createdAt ?? new Date().toISOString().split("T")[0],
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div
        className="relative w-[520px] rounded-2xl shadow-2xl flex flex-col"
        style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: "#E2E8F0" }}>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "#EEF2FF" }}>
              <Shield className="h-4 w-4" style={{ color: "#0F2870" }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: "#1C2434" }}>
                {editAgent ? "Editar Agente Guardrail" : "Nuevo Agente Guardrail"}
              </h2>
              <p className="text-xs text-slate-400">Asocia un prompt con un modelo LLM</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#374151" }}>
              Nombre del agente
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ej. SQL Guard - Flash"
              className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors"
              style={{ borderColor: "#E2E8F0", color: "#1C2434" }}
            />
          </div>

          {/* Prompt selector */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#374151" }}>
              Prompt Template
            </label>
            <div className="space-y-2">
              {prompts.map((p) => (
                <label
                  key={p.id}
                  className="flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors"
                  style={
                    promptId === p.id
                      ? { borderColor: "#0F2870", background: "#EEF2FF" }
                      : { borderColor: "#E2E8F0", background: "#FAFBFC" }
                  }
                >
                  <input
                    type="radio"
                    name="promptId"
                    value={p.id}
                    checked={promptId === p.id}
                    onChange={() => setPromptId(p.id)}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-xs font-medium" style={{ color: "#1C2434" }}>{p.title}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: "#637381" }}>{p.description.slice(0, 65)}...</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <CategoryBadge category={p.category} />
                      <span className="text-[10px] text-slate-400">{p.latestVersion}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Model + temperature row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#374151" }}>
                Modelo LLM
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
                style={{ borderColor: "#E2E8F0", color: "#1C2434" }}
              >
                {MODELS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#374151" }}>
                Temperatura: <span className="font-mono text-[#0F2870]">{temperature}</span>
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full mt-2"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#374151" }}>Estado</label>
            <div className="flex gap-2">
              {(["draft", "active", "inactive"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className="flex-1 py-2 rounded-lg border text-xs font-medium capitalize transition-colors"
                  style={
                    status === s
                      ? { background: "#0F2870", color: "#fff", borderColor: "#0F2870" }
                      : { background: "#F8FAFC", color: "#475569", borderColor: "#E2E8F0" }
                  }
                >
                  {s === "draft" ? "Borrador" : s === "active" ? "Activo" : "Inactivo"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex gap-2" style={{ borderColor: "#E2E8F0" }}>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors"
            style={{ borderColor: "#E2E8F0", color: "#475569" }}
          >
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={!name.trim()}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-40"
            style={{ background: "#D4009A" }}
          >
            {editAgent ? "Guardar cambios" : "Crear agente"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── New Prompt Modal ─────────────────────────────────────────────────────────

function NewPromptModal({
  onSave,
  onClose,
}: {
  onSave: (p: PromptTemplate) => void
  onClose: () => void
}) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<PromptCategory>("Seguridad")
  const [tags, setTags] = useState("")
  const [content, setContent] = useState("")

  const save = () => {
    if (!title.trim() || !content.trim()) return
    onSave({
      id: `pt-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      category,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      latestVersion: "v1.0",
      usedBy: 0,
      createdAt: new Date().toISOString().split("T")[0],
      versions: [
        {
          version: "v1.0",
          content: content.trim(),
          createdAt: new Date().toISOString().split("T")[0],
          author: "Usuario",
        },
      ],
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div
        className="relative w-[600px] max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b shrink-0" style={{ borderColor: "#E2E8F0" }}>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: "#1C2434" }}>Nuevo Prompt Template</h2>
            <p className="text-xs text-slate-400">Define el prompt base del guardrail</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        <div className="overflow-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#374151" }}>Título</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ej. Filtro de Inyección XSS"
                className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
                style={{ borderColor: "#E2E8F0", color: "#1C2434" }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#374151" }}>Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PromptCategory)}
                className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
                style={{ borderColor: "#E2E8F0", color: "#1C2434" }}
              >
                {(["Seguridad", "Ética", "Formato", "Veracidad"] as const).map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#374151" }}>Descripción</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe qué hace este guardrail..."
              className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
              style={{ borderColor: "#E2E8F0", color: "#1C2434" }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#374151" }}>
              Tags <span className="font-normal text-slate-400">(separados por coma)</span>
            </label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="ej. xss, injection, input"
              className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
              style={{ borderColor: "#E2E8F0", color: "#1C2434" }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#374151" }}>
              Contenido del Prompt
              <span className="font-normal text-slate-400 ml-1">— usa {"{{variable}}"} para variables</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              placeholder={`Eres un guardrail de seguridad...\n\nInput: {{user_input}}\n\nResponde con JSON:\n{ "safe": true | false, "reason": "..." }`}
              className="w-full rounded-xl border px-3 py-3 text-xs font-mono outline-none resize-none leading-relaxed"
              style={{ borderColor: "#E2E8F0", color: "#1C2434", background: "#0F1117", color: "#E2E8F0" }}
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t flex gap-2 shrink-0" style={{ borderColor: "#E2E8F0" }}>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border text-sm font-medium"
            style={{ borderColor: "#E2E8F0", color: "#475569" }}
          >
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={!title.trim() || !content.trim()}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-40"
            style={{ background: "#D4009A" }}
          >
            Guardar prompt
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main View ────────────────────────────────────────────────────────────────

export default function GuardrailsView() {
  const [activeTab, setActiveTab] = useState<"prompts" | "agents">("prompts")
  const [prompts, setPrompts] = useState<PromptTemplate[]>(INITIAL_PROMPTS)
  const [agents, setAgents] = useState<GuardrailAgent[]>(INITIAL_AGENTS)
  const [searchPrompt, setSearchPrompt] = useState("")
  const [searchAgent, setSearchAgent] = useState("")
  const [filterCategory, setFilterCategory] = useState<PromptCategory | "Todos">("Todos")
  const [drawerPrompt, setDrawerPrompt] = useState<PromptTemplate | null>(null)
  const [promptModalOpen, setPromptModalOpen] = useState(false)
  const [agentModalOpen, setAgentModalOpen] = useState(false)
  const [editingAgent, setEditingAgent] = useState<GuardrailAgent | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  const filteredPrompts = prompts.filter((p) => {
    const matchSearch =
      p.title.toLowerCase().includes(searchPrompt.toLowerCase()) ||
      p.tags.some((t) => t.includes(searchPrompt.toLowerCase()))
    const matchCategory = filterCategory === "Todos" || p.category === filterCategory
    return matchSearch && matchCategory
  })

  const filteredAgents = agents.filter((a) => {
    const prompt = prompts.find((p) => p.id === a.promptId)
    return (
      a.name.toLowerCase().includes(searchAgent.toLowerCase()) ||
      a.model.toLowerCase().includes(searchAgent.toLowerCase()) ||
      prompt?.title.toLowerCase().includes(searchAgent.toLowerCase())
    )
  })

  const cloneAgent = (agent: GuardrailAgent) => {
    setAgents((prev) => [
      ...prev,
      {
        ...agent,
        id: `ga-${Date.now()}`,
        name: `${agent.name} (copia)`,
        status: "draft",
        usedInAgents: 0,
        createdAt: new Date().toISOString().split("T")[0],
      },
    ])
    setMenuOpen(null)
  }

  const deleteAgent = (id: string) => {
    setAgents((prev) => prev.filter((a) => a.id !== id))
    setDeleteConfirm(null)
    setMenuOpen(null)
  }

  const tabs = [
    { key: "prompts" as const, label: "Repositorio de Prompts", count: prompts.length },
    { key: "agents" as const, label: "Agentes Guardrail", count: agents.length },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="px-8 pt-8 pb-6 border-b shrink-0" style={{ borderColor: "#E2E8F0" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center"
                style={{ background: "#EEF2FF" }}
              >
                <Shield className="h-5 w-5" style={{ color: "#0F2870" }} />
              </div>
              <div>
                <h1 className="text-xl font-semibold" style={{ color: "#1C2434" }}>
                  Guardrails / Políticas
                </h1>
                <p className="text-sm" style={{ color: "#637381" }}>
                  Repositorio de prompts de seguridad y directorio de agentes guardrail
                </p>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex gap-3">
            {[
              { label: "Prompts", value: prompts.length, icon: FileText },
              { label: "Agentes activos", value: agents.filter((a) => a.status === "active").length, icon: CheckCircle2 },
              { label: "En borrador", value: agents.filter((a) => a.status === "draft").length, icon: AlertTriangle },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border"
                style={{ background: "#F8FAFC", borderColor: "#E2E8F0" }}
              >
                <Icon className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-lg font-semibold" style={{ color: "#1C2434" }}>{value}</span>
                <span className="text-xs text-slate-400">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={
                activeTab === tab.key
                  ? { background: "#0F2870", color: "#fff" }
                  : { background: "transparent", color: "#637381" }
              }
            >
              {tab.label}
              <span
                className="px-1.5 py-0.5 rounded-full text-xs"
                style={
                  activeTab === tab.key
                    ? { background: "rgba(255,255,255,0.2)", color: "#fff" }
                    : { background: "#F1F5F9", color: "#64748B" }
                }
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto px-8 py-6">

        {/* ── PROMPTS TAB ── */}
        {activeTab === "prompts" && (
          <div className="space-y-5">
            {/* Toolbar */}
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-2 flex-1 max-w-xs rounded-lg border px-3 py-2"
                style={{ borderColor: "#E2E8F0", background: "#F8FAFC" }}
              >
                <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <input
                  value={searchPrompt}
                  onChange={(e) => setSearchPrompt(e.target.value)}
                  placeholder="Buscar prompts..."
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: "#1C2434" }}
                />
              </div>

              {/* Category filter */}
              <div className="flex gap-1.5">
                {(["Todos", "Seguridad", "Ética", "Formato", "Veracidad"] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className="px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors"
                    style={
                      filterCategory === cat
                        ? { background: "#0F2870", color: "#fff", borderColor: "#0F2870" }
                        : { background: "#F8FAFC", color: "#475569", borderColor: "#E2E8F0" }
                    }
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setPromptModalOpen(true)}
                className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                style={{ background: "#D4009A" }}
              >
                <Plus className="h-3.5 w-3.5" />
                Nuevo Prompt
              </button>
            </div>

            {/* Prompt grid */}
            <div className="grid grid-cols-2 gap-4">
              {filteredPrompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className="rounded-2xl border p-5 flex flex-col gap-3 hover:shadow-sm transition-shadow cursor-pointer"
                  style={{ background: "#FFFFFF", borderColor: "#E2E8F0" }}
                  onClick={() => setDrawerPrompt(prompt)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <CategoryBadge category={prompt.category} />
                        <span
                          className="text-[11px] font-mono px-1.5 py-0.5 rounded border"
                          style={{ background: "#F8FAFC", color: "#0F2870", borderColor: "#BFDBFE" }}
                        >
                          {prompt.latestVersion}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold" style={{ color: "#1C2434" }}>{prompt.title}</h3>
                      <p className="text-xs mt-1 leading-relaxed" style={{ color: "#637381" }}>
                        {prompt.description}
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDrawerPrompt(prompt) }}
                      className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
                    >
                      <Eye className="h-3.5 w-3.5 text-slate-400" />
                    </button>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {prompt.tags.slice(0, 3).map((t) => <TagChip key={t} label={t} />)}
                    {prompt.tags.length > 3 && (
                      <span className="text-[11px] text-slate-400">+{prompt.tags.length - 3}</span>
                    )}
                  </div>

                  {/* Footer */}
                  <div
                    className="flex items-center justify-between pt-3 border-t text-xs"
                    style={{ borderColor: "#F1F5F9", color: "#94A3B8" }}
                  >
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {prompt.versions.length} {prompt.versions.length === 1 ? "versión" : "versiones"}
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      Usado en {prompt.usedBy} agentes
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation() }}
                      className="flex items-center gap-1 hover:text-[#0F2870] transition-colors"
                    >
                      <ChevronRight className="h-3 w-3" />
                      Ver prompt
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── AGENTS TAB ── */}
        {activeTab === "agents" && (
          <div className="space-y-5">
            {/* Toolbar */}
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-2 flex-1 max-w-xs rounded-lg border px-3 py-2"
                style={{ borderColor: "#E2E8F0", background: "#F8FAFC" }}
              >
                <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <input
                  value={searchAgent}
                  onChange={(e) => setSearchAgent(e.target.value)}
                  placeholder="Buscar agentes, modelos..."
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: "#1C2434" }}
                />
              </div>

              <button
                onClick={() => { setEditingAgent(null); setAgentModalOpen(true) }}
                className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                style={{ background: "#D4009A" }}
              >
                <Plus className="h-3.5 w-3.5" />
                Nuevo Agente
              </button>
            </div>

            {/* Agents table */}
            <div
              className="rounded-2xl border overflow-hidden"
              style={{ borderColor: "#E2E8F0" }}
            >
              <table className="w-full">
                <thead>
                  <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                    {["Agente", "Prompt Template", "Modelo", "Temperatura", "Estado", "Usos", ""].map((h) => (
                      <th
                        key={h}
                        className="text-left px-5 py-3 text-xs font-medium uppercase tracking-wide"
                        style={{ color: "#637381" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAgents.map((agent, idx) => {
                    const prompt = prompts.find((p) => p.id === agent.promptId)
                    return (
                      <tr
                        key={agent.id}
                        className="border-b last:border-0 transition-colors hover:bg-slate-50"
                        style={{ borderColor: "#F1F5F9" }}
                      >
                        {/* Agente */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                              style={{ background: "#EEF2FF" }}
                            >
                              <Shield className="h-4 w-4" style={{ color: "#0F2870" }} />
                            </div>
                            <div>
                              <p className="text-sm font-medium" style={{ color: "#1C2434" }}>{agent.name}</p>
                              <p className="text-[11px] text-slate-400">{agent.createdAt}</p>
                            </div>
                          </div>
                        </td>

                        {/* Prompt */}
                        <td className="px-5 py-4">
                          {prompt ? (
                            <div>
                              <p className="text-xs font-medium" style={{ color: "#1C2434" }}>{prompt.title}</p>
                              <CategoryBadge category={prompt.category} />
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>

                        {/* Modelo */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <Cpu className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-xs font-mono" style={{ color: "#1C2434" }}>{agent.model}</span>
                          </div>
                        </td>

                        {/* Temperatura */}
                        <td className="px-5 py-4">
                          <span
                            className="text-xs font-mono px-2 py-0.5 rounded border"
                            style={{ background: "#F8FAFC", color: "#0F2870", borderColor: "#BFDBFE" }}
                          >
                            {agent.temperature}
                          </span>
                        </td>

                        {/* Estado */}
                        <td className="px-5 py-4">
                          <StatusBadge status={agent.status} />
                        </td>

                        {/* Usos */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1">
                            <Zap className="h-3 w-3 text-slate-400" />
                            <span className="text-xs text-slate-500">{agent.usedInAgents} agentes</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4">
                          <div className="relative">
                            <button
                              onClick={() => setMenuOpen(menuOpen === agent.id ? null : agent.id)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                              <MoreHorizontal className="h-4 w-4 text-slate-400" />
                            </button>

                            {menuOpen === agent.id && (
                              <div
                                className="absolute right-0 top-8 z-20 w-44 rounded-xl border shadow-lg py-1"
                                style={{ background: "#fff", borderColor: "#E2E8F0" }}
                              >
                                <button
                                  onClick={() => { setEditingAgent(agent); setAgentModalOpen(true); setMenuOpen(null) }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-slate-50 transition-colors"
                                  style={{ color: "#374151" }}
                                >
                                  <Pencil className="h-3.5 w-3.5" /> Editar
                                </button>
                                <button
                                  onClick={() => cloneAgent(agent)}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-slate-50 transition-colors"
                                  style={{ color: "#374151" }}
                                >
                                  <Copy className="h-3.5 w-3.5" /> Clonar configuración
                                </button>
                                <div className="my-1 border-t" style={{ borderColor: "#F1F5F9" }} />
                                <button
                                  onClick={() => { setDeleteConfirm(agent.id); setMenuOpen(null) }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-red-50 transition-colors"
                                  style={{ color: "#BE123C" }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Eliminar
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {filteredAgents.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-sm">
                  No se encontraron agentes guardrail.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Prompt Drawer */}
      {drawerPrompt && (
        <PromptDrawer prompt={drawerPrompt} onClose={() => setDrawerPrompt(null)} />
      )}

      {/* New Prompt Modal */}
      {promptModalOpen && (
        <NewPromptModal
          onSave={(p) => setPrompts((prev) => [p, ...prev])}
          onClose={() => setPromptModalOpen(false)}
        />
      )}

      {/* New/Edit Agent Modal */}
      {agentModalOpen && (
        <NewAgentModal
          prompts={prompts}
          editAgent={editingAgent}
          onSave={(a) =>
            setAgents((prev) =>
              editingAgent ? prev.map((x) => (x.id === a.id ? a : x)) : [a, ...prev]
            )
          }
          onClose={() => { setAgentModalOpen(false); setEditingAgent(null) }}
        />
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDeleteConfirm(null)} />
          <div
            className="relative w-80 rounded-2xl p-6 shadow-2xl"
            style={{ background: "#fff", border: "1px solid #E2E8F0" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "#FFF1F2" }}>
                <Trash2 className="h-4 w-4" style={{ color: "#BE123C" }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "#1C2434" }}>Eliminar agente</p>
                <p className="text-xs text-slate-400">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 rounded-lg border text-sm font-medium"
                style={{ borderColor: "#E2E8F0", color: "#475569" }}
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteAgent(deleteConfirm)}
                className="flex-1 py-2 rounded-lg text-sm font-medium text-white"
                style={{ background: "#BE123C" }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop for menu close */}
      {menuOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
      )}
    </div>
  )
}
