"use client"

import { useState, useCallback } from "react"
import {
  mockTemplates,
  mockInstances,
  mockAreas,
  type MCPTemplate,
  type MCPInstance,
} from "./mcp-data"

// Simple current user for demo (Manager role by default)
export const currentUser = {
  id: "user-manager",
  name: "Ana García",
  email: "ana@company.com",
  areaId: "area-design", // Manager manages Design area
}

export function useMCPStore() {
  const [templates, setTemplates] = useState<MCPTemplate[]>(mockTemplates)
  const [instances, setInstances] = useState<MCPInstance[]>(mockInstances)

  const addTemplate = useCallback((t: MCPTemplate) => {
    setTemplates((prev) => [...prev, t])
  }, [])

  const updateTemplate = useCallback((t: MCPTemplate) => {
    setTemplates((prev) => prev.map((x) => (x.id === t.id ? t : x)))
  }, [])

  const deleteTemplate = useCallback((id: string) => {
    setTemplates((prev) => prev.filter((x) => x.id !== id))
  }, [])

  const addInstance = useCallback((i: MCPInstance) => {
    setInstances((prev) => [...prev, i])
  }, [])

  const updateInstance = useCallback((i: MCPInstance) => {
    setInstances((prev) => prev.map((x) => (x.id === i.id ? i : x)))
  }, [])

  const deleteInstance = useCallback((id: string) => {
    setInstances((prev) => prev.filter((x) => x.id !== id))
  }, [])

  return {
    templates,
    instances,
    areas: mockAreas,
    currentUser,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    addInstance,
    updateInstance,
    deleteInstance,
  }
}
