import React, { useState } from 'react';
import { N8nWorkflow, N8nNode } from '../types';
import { Copy, Check, Boxes, FileJson, Key, Lightbulb, CloudUpload, AlertCircle, ExternalLink } from 'lucide-react';
import { N8nConnectionConfig, saveWorkflowToN8n } from '../services/n8nApiService';

interface WorkflowPreviewProps {
  workflow: N8nWorkflow | null;
  credentials: string[];
  tips: string[];
  n8nConfig: N8nConnectionConfig | null;
  onOpenSettings: () => void;
}

export const WorkflowPreview: React.FC<WorkflowPreviewProps> = ({ 
  workflow, 
  credentials, 
  tips, 
  n8nConfig,
  onOpenSettings 
}) => {
  const [activeTab, setActiveTab] = useState<'visual' | 'json' | 'setup'>('visual');
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{success: boolean; message: string} | null>(null);

  const handleCopy = () => {
    if (!workflow) return;
    navigator.clipboard.writeText(JSON.stringify(workflow, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToN8n = async () => {
    if (!workflow || !n8nConfig) {
        onOpenSettings();
        return;
    }
    
    setIsSaving(true);
    setSaveStatus(null);
    try {
        const result = await saveWorkflowToN8n(n8nConfig, workflow);
        setSaveStatus({
            success: true,
            message: `Workflow "${result.name}" salvo com sucesso! (ID: ${result.id})`
        });
    } catch (error) {
        setSaveStatus({
            success: false,
            message: `Erro ao salvar: ${(error as Error).message}. Verifique CORS e credenciais.`
        });
    } finally {
        setIsSaving(false);
    }
  };

  if (!workflow) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500 bg-gray-900/50 p-8 text-center">
        <Boxes size={64} className="mb-4 opacity-20" />
        <h3 className="text-xl font-medium text-gray-400">Nenhum Workflow Gerado</h3>
        <p className="mt-2 text-sm max-w-md">
            Descreva o que você precisa no chat e o agente irá gerar o código JSON do n8n para você aqui.
        </p>
      </div>
    );
  }

  // Helper to get friendly node name
  const getNodeName = (node: N8nNode) => {
    const parts = node.type.split('.');
    return parts[parts.length - 1].replace(/([A-Z])/g, ' $1').trim();
  };

  return (
    <div className="flex flex-col h-full bg-[#1a202c]">
        {/* Header / Tabs */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-700 bg-gray-800">
        <div className="flex gap-4">
            <button
                onClick={() => setActiveTab('visual')}
                className={`flex items-center gap-2 pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'visual' ? 'border-n8n-primary text-n8n-primary' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
            >
                <Boxes size={16} /> Visão Geral
            </button>
            <button
                onClick={() => setActiveTab('json')}
                className={`flex items-center gap-2 pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'json' ? 'border-n8n-primary text-n8n-primary' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
            >
                <FileJson size={16} /> Código JSON
            </button>
            <button
                onClick={() => setActiveTab('setup')}
                className={`flex items-center gap-2 pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'setup' ? 'border-n8n-primary text-n8n-primary' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
            >
                <Key size={16} /> Configuração
            </button>
        </div>
        
        <div className="flex gap-2">
            <button
                onClick={handleSaveToN8n}
                disabled={isSaving}
                title={n8nConfig ? "Salvar na instância configurada" : "Configurar instância n8n"}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-all border ${
                    isSaving 
                        ? 'bg-gray-600 border-gray-600 text-gray-300 cursor-wait' 
                        : 'bg-transparent border-n8n-primary text-n8n-primary hover:bg-n8n-primary/10'
                }`}
            >
                {isSaving ? <span className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full"></span> : <CloudUpload size={14} />}
                {isSaving ? 'Salvando...' : 'Salvar no N8N'}
            </button>

            <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-all ${
                copied ? 'bg-green-600 text-white' : 'bg-n8n-primary hover:bg-n8n-hover text-white'
            }`}
            >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copiado!' : 'Copiar'}
            </button>
        </div>
      </div>

      {/* Save Status Notification */}
      {saveStatus && (
        <div className={`mx-6 mt-4 p-3 rounded-md flex items-start gap-2 text-sm ${saveStatus.success ? 'bg-green-900/30 text-green-200 border border-green-800' : 'bg-red-900/30 text-red-200 border border-red-800'}`}>
            {saveStatus.success ? <Check size={16} className="mt-0.5" /> : <AlertCircle size={16} className="mt-0.5" />}
            <span className="flex-1">{saveStatus.message}</span>
            <button onClick={() => setSaveStatus(null)} className="opacity-70 hover:opacity-100"><ExternalLink size={14}/></button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        
        {/* VISUAL TAB */}
        {activeTab === 'visual' && (
          <div className="space-y-4">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-white text-lg font-semibold">Fluxo de Automação</h3>
                <span className="text-gray-500 text-xs">{workflow.nodes.length} nós identificados</span>
             </div>
            
            <div className="relative">
                {/* Vertical Line connecting nodes */}
                <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gray-700 -z-10"></div>

                {workflow.nodes.sort((a,b) => a.position[0] - b.position[0]).map((node, i) => (
                    <div key={node.id} className="mb-6 flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-gray-800 border-2 border-n8n-primary flex items-center justify-center shrink-0 z-10 shadow-lg">
                            <span className="text-n8n-primary font-bold text-lg">{i + 1}</span>
                        </div>
                        <div className="flex-1 bg-gray-800 rounded-lg p-4 border border-gray-700 shadow-sm hover:border-gray-500 transition-colors">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-white text-md">{node.name}</h4>
                                    <span className="text-xs text-n8n-primary font-mono bg-n8n-primary/10 px-2 py-0.5 rounded mt-1 inline-block">
                                        {node.type}
                                    </span>
                                </div>
                            </div>
                            {Object.keys(node.parameters).length > 0 && (
                                <div className="mt-3 bg-gray-900/50 rounded p-2 text-xs font-mono text-gray-400 overflow-hidden">
                                    <div className="opacity-75 mb-1">Parâmetros chave:</div>
                                    {Object.entries(node.parameters).slice(0, 3).map(([k, v]) => (
                                        <div key={k} className="truncate">
                                            <span className="text-gray-500">{k}:</span> <span className="text-gray-300">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                                        </div>
                                    ))}
                                    {Object.keys(node.parameters).length > 3 && <div className="italic text-gray-600 mt-1">...mais configurações</div>}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
          </div>
        )}

        {/* JSON TAB */}
        {activeTab === 'json' && (
          <div className="relative h-full">
            <pre className="h-full bg-gray-900 p-4 rounded-lg overflow-auto text-xs font-mono text-green-400 leading-relaxed border border-gray-700 shadow-inner">
              {JSON.stringify(workflow, null, 2)}
            </pre>
          </div>
        )}

        {/* SETUP TAB */}
        {activeTab === 'setup' && (
            <div className="space-y-6">
                 {/* Credentials Section */}
                <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
                    <div className="flex items-center gap-2 mb-4 text-white">
                        <Key className="text-yellow-500" />
                        <h3 className="font-semibold text-lg">Credenciais Necessárias</h3>
                    </div>
                    {credentials && credentials.length > 0 ? (
                        <ul className="space-y-2">
                            {credentials.map((cred, i) => (
                                <li key={i} className="flex items-center gap-3 bg-gray-700/50 p-2 rounded border border-gray-600">
                                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                    <span className="text-gray-200">{cred}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-400 italic text-sm">Nenhuma credencial específica detectada pelo agente.</p>
                    )}
                </div>

                {/* Tips Section */}
                {tips && tips.length > 0 && (
                    <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
                        <div className="flex items-center gap-2 mb-4 text-white">
                            <Lightbulb className="text-blue-400" />
                            <h3 className="font-semibold text-lg">Dicas de Configuração</h3>
                        </div>
                        <ul className="space-y-3">
                             {tips.map((tip, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                                    <span className="bg-blue-500/20 text-blue-400 rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0 mt-0.5">{i+1}</span>
                                    <span>{tip}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                 <div className="bg-blue-900/20 border border-blue-900/50 p-4 rounded-lg text-sm text-blue-200">
                    <strong>Como importar:</strong> No n8n, copie o código da aba "Código JSON", clique na tela do canvas e pressione <kbd className="bg-gray-700 px-1 py-0.5 rounded">Ctrl + V</kbd> (ou Cmd + V).
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
