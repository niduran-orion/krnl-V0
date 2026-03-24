// ─── Types ───────────────────────────────────────────────────────────────────

export type TransportMode = "json" | "stdio" | "http"
export type Transport = "NPX (stdio)" | "UVX (stdio)" | "Streamable HTTP"
export type Role = "admin" | "manager" | "user"
export type Status = "active" | "inactive"

export interface KeyValuePair {
  key: string
  value: string
}

export interface FieldDef {
  key: string
  label: string
  placeholder: string
  required: boolean
  secret?: boolean
}

// New template structure matching the modal design
export interface MCPTemplate {
  id: string
  name: string
  description: string
  transport: Transport
  transportMode: TransportMode
  // For JSON mode
  jsonConfig?: string
  // For STDIO mode (npx/uvx)
  command?: string
  args?: string[]
  // For HTTP mode
  url?: string
  headers?: KeyValuePair[]
  // Common env vars
  envVars?: KeyValuePair[]
  // Legacy fields for compatibility
  configFields: FieldDef[]
  envFields: FieldDef[]
  status: Status
  createdAt: string
}

export interface MCPInstance {
  id: string
  templateId: string
  name: string // Instance display name (can differ from template)
  areaId: string
  // Filled env var values from the template's envVars
  envValues: Record<string, string>
  // Optional overrides for HTTP instances
  urlOverride?: string
  headersOverride?: KeyValuePair[]
  // Optional overrides for STDIO instances  
  argsOverride?: string[]
  status: Status
  createdAt: string
}

export interface Area {
  id: string
  name: string
  memberCount: number
}

export interface AppUser {
  id: string
  name: string
  email: string
  role: Role
  areaId: string
}

// ─── Mock Templates ───────────────────────────────────────────────────────────

export const mockTemplates: MCPTemplate[] = [
  {
    id: "tpl-atlassian",
    name: "atlassian",
    description:
      "Atlassian MCP — Jira and Confluence integration via the official Atlassian remote MCP endpoint.",
    transport: "Streamable HTTP",
    transportMode: "http",
    url: "https://mcp.atlassian.com/mcp",
    headers: [
      { key: "Authorization", value: "Bearer ${ATLASSIAN_API_TOKEN}" },
    ],
    envVars: [
      { key: "ATLASSIAN_API_TOKEN", value: "" },
      { key: "ATLASSIAN_EMAIL", value: "" },
    ],
    configFields: [],
    envFields: [
      { key: "ATLASSIAN_API_TOKEN", label: "API Token", placeholder: "atl_xxxxxxxxxxxxxxxx", required: true, secret: true },
      { key: "ATLASSIAN_EMAIL", label: "Email de cuenta", placeholder: "user@company.com", required: true },
    ],
    status: "active",
    createdAt: "2025-01-10",
  },
  {
    id: "tpl-bigquery",
    name: "bigquery mcp",
    description: "Integración con Google BigQuery para consultas SQL sobre data warehouse.",
    transport: "Streamable HTTP",
    transportMode: "http",
    url: "https://mcp.context7.com/mcp",
    headers: [],
    envVars: [
      { key: "BIGQUERY_PROJECT_ID", value: "" },
      { key: "GOOGLE_SERVICE_ACCOUNT_KEY", value: "" },
    ],
    configFields: [],
    envFields: [
      { key: "BIGQUERY_PROJECT_ID", label: "Project ID", placeholder: "my-gcp-project", required: true },
      { key: "GOOGLE_SERVICE_ACCOUNT_KEY", label: "Service Account Key (JSON)", placeholder: '{"type": "service_account", ...}', required: true, secret: true },
    ],
    status: "active",
    createdAt: "2025-01-12",
  },
  {
    id: "tpl-figma",
    name: "figma-desktop",
    description:
      "Figma Desktop MCP — connects to the locally running Figma desktop app MCP server for design context.",
    transport: "Streamable HTTP",
    transportMode: "http",
    url: "http://127.0.0.1:3845/sse",
    headers: [
      { key: "X-Figma-Token", value: "${FIGMA_ACCESS_TOKEN}" },
    ],
    envVars: [
      { key: "FIGMA_ACCESS_TOKEN", value: "" },
    ],
    configFields: [],
    envFields: [
      { key: "FIGMA_ACCESS_TOKEN", label: "Access Token", placeholder: "figd_xxxxxxxxxxxxxxxx", required: true, secret: true },
    ],
    status: "active",
    createdAt: "2025-01-15",
  },
  {
    id: "tpl-playwright",
    name: "playwright",
    description:
      "Playwright MCP — browser automation and web scraping tools running via npx locally.",
    transport: "NPX (stdio)",
    transportMode: "stdio",
    command: "npx",
    args: ["@playwright/mcp@latest"],
    envVars: [],
    configFields: [],
    envFields: [],
    status: "active",
    createdAt: "2025-01-18",
  },
  {
    id: "tpl-pokemon",
    name: "pokemon mcp",
    description: "MCP para consultar información sobre pokémons mediante la PokéAPI.",
    transport: "Streamable HTTP",
    transportMode: "http",
    url: "https://piano.alpic.live",
    headers: [],
    envVars: [
      { key: "POKEMON_API_KEY", value: "" },
    ],
    configFields: [],
    envFields: [
      { key: "POKEMON_API_KEY", label: "API Key", placeholder: "pk_xxxxxxxxxxxxxxxx", required: false, secret: true },
    ],
    status: "active",
    createdAt: "2025-01-20",
  },
  {
    id: "tpl-filesystem",
    name: "filesystem",
    description: "Servidor MCP para acceso al sistema de archivos local con permisos configurables.",
    transport: "NPX (stdio)",
    transportMode: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/dir"],
    envVars: [],
    configFields: [],
    envFields: [],
    status: "active",
    createdAt: "2025-01-22",
  },
  {
    id: "tpl-github",
    name: "github",
    description: "GitHub MCP — acceso a repositorios, issues, PRs y más vía la API de GitHub.",
    transport: "UVX (stdio)",
    transportMode: "stdio",
    command: "uvx",
    args: ["mcp-server-github"],
    envVars: [
      { key: "GITHUB_PERSONAL_ACCESS_TOKEN", value: "" },
    ],
    configFields: [],
    envFields: [
      { key: "GITHUB_PERSONAL_ACCESS_TOKEN", label: "Personal Access Token", placeholder: "ghp_xxxxxxxxxxxxxxxx", required: true, secret: true },
    ],
    status: "active",
    createdAt: "2025-01-25",
  },
]

// ─── Mock Areas ───────────────────────────────────────────────────────────────

export const mockAreas: Area[] = [
  { id: "area-engineering", name: "Engineering", memberCount: 12 },
  { id: "area-design", name: "Design", memberCount: 6 },
  { id: "area-marketing", name: "Marketing", memberCount: 8 },
  { id: "area-data", name: "Data & Analytics", memberCount: 5 },
]

// ─── Mock Instances ───────────────────────────────────────────────────────────

export const mockInstances: MCPInstance[] = [
  {
    id: "inst-001",
    templateId: "tpl-bigquery",
    name: "BigQuery - Data Warehouse Prod",
    areaId: "area-data",
    envValues: {
      BIGQUERY_PROJECT_ID: "prod-data-warehouse",
      GOOGLE_SERVICE_ACCOUNT_KEY: "••••••••",
    },
    status: "active",
    createdAt: "2025-02-01",
  },
  {
    id: "inst-002",
    templateId: "tpl-github",
    name: "GitHub - Monorepo Access",
    areaId: "area-engineering",
    envValues: {
      GITHUB_PERSONAL_ACCESS_TOKEN: "••••••••",
    },
    status: "active",
    createdAt: "2025-02-05",
  },
  {
    id: "inst-003",
    templateId: "tpl-atlassian",
    name: "Atlassian - Design Jira",
    areaId: "area-design",
    envValues: {
      ATLASSIAN_API_TOKEN: "••••••••",
      ATLASSIAN_EMAIL: "design-team@company.com",
    },
    status: "active",
    createdAt: "2025-02-08",
  },
  {
    id: "inst-004",
    templateId: "tpl-figma",
    name: "Figma Desktop - Design Team",
    areaId: "area-design",
    envValues: {
      FIGMA_ACCESS_TOKEN: "••••••••",
    },
    status: "active",
    createdAt: "2025-02-10",
  },
  {
    id: "inst-005",
    templateId: "tpl-playwright",
    name: "Playwright - QA Automation",
    areaId: "area-engineering",
    envValues: {},
    status: "active",
    createdAt: "2025-02-12",
  },
  {
    id: "inst-006",
    templateId: "tpl-filesystem",
    name: "Filesystem - Marketing Assets",
    areaId: "area-marketing",
    argsOverride: ["-y", "@modelcontextprotocol/server-filesystem", "/data/marketing/assets"],
    envValues: {},
    status: "active",
    createdAt: "2025-02-15",
  },
]

// ─── Mock Users ───────────────────────────────────────────────────────────────

export const mockUsers: Record<Role, AppUser> = {
  admin: {
    id: "user-admin",
    name: "Carlos Mendoza",
    email: "carlos@company.com",
    role: "admin",
    areaId: "area-engineering",
  },
  manager: {
    id: "user-manager",
    name: "Ana García",
    email: "ana@company.com",
    role: "manager",
    areaId: "area-design",
  },
  user: {
    id: "user-member",
    name: "Luis Torres",
    email: "luis@company.com",
    role: "user",
    areaId: "area-engineering",
  },
}
