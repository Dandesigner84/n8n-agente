import { N8nWorkflow } from "../types";

export interface N8nConnectionConfig {
  baseUrl: string;
  apiKey: string;
}

export const validateN8nConnection = async (config: N8nConnectionConfig): Promise<boolean> => {
  const cleanUrl = config.baseUrl.replace(/\/$/, "");
  // Try to fetch a lightweight resource to validate auth
  const endpoint = `${cleanUrl}/api/v1/workflows?limit=1`;

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-N8N-API-KEY": config.apiKey,
      },
    });

    // Check if status is OK
    if (!response.ok) return false;

    // Check if content-type is JSON (prevents HTML parking pages from passing as valid)
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        return false;
    }

    return true;
  } catch (error) {
    console.error("Validation Error:", error);
    return false;
  }
};

export const saveWorkflowToN8n = async (
  config: N8nConnectionConfig,
  workflow: N8nWorkflow
): Promise<{ id: string; name: string }> => {
  // Ensure URL doesn't have trailing slash
  const cleanUrl = config.baseUrl.replace(/\/$/, "");
  const endpoint = `${cleanUrl}/api/v1/workflows`;

  // Provide a default name if not present (the AI usually doesn't strictly name the workflow object)
  const workflowName = `AI Generated Workflow - ${new Date().toLocaleString()}`;
  
  // The API expects the workflow object wrapped. 
  // Note: The AI returns { nodes: [], connections: {} }. The API accepts this payload directly
  // but we should ensure 'name' is present if creating a new one.
  const payload = {
    name: workflowName,
    nodes: workflow.nodes,
    connections: workflow.connections,
    settings: {
        saveManualExecutions: true,
        callers: []
    },
    ...workflow.meta // Spread any meta if exists
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-N8N-API-KEY": config.apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || `Erro ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("N8N API Error:", error);
    throw error;
  }
};