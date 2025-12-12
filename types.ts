export interface Message {
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

export interface N8nNode {
  parameters: Record<string, any>;
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
}

export interface N8nConnection {
  main: Array<Array<{
    node: string;
    type: string;
    index: number;
  }>>;
}

export interface N8nWorkflow {
  nodes: N8nNode[];
  connections: Record<string, N8nConnection>;
  meta?: any;
}

export interface AIResponseSchema {
  explanation: string;
  workflow?: N8nWorkflow | null;
  requiredCredentials?: string[];
  tips?: string[];
}
