import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { ChatInterface } from './components/ChatInterface';
import { WorkflowPreview } from './components/WorkflowPreview';
import { SettingsModal } from './components/SettingsModal';
import { sendMessageToGemini } from './services/geminiService';
import { N8nConnectionConfig } from './services/n8nApiService';
import { Message, N8nWorkflow } from './types';
import { Workflow, Settings, Globe, Monitor, ExternalLink } from 'lucide-react';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentWorkflow, setCurrentWorkflow] = useState<N8nWorkflow | null>(null);
  const [workflowCredentials, setWorkflowCredentials] = useState<string[]>([]);
  const [workflowTips, setWorkflowTips] = useState<string[]>([]);
  
  // UI State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'live'>('preview');
  const [isChatMinimized, setIsChatMinimized] = useState(false);

  // N8N Connection State
  const [n8nConfig, setN8nConfig] = useState<N8nConnectionConfig | null>(null);

  // Load config on mount
  useEffect(() => {
    const saved = localStorage.getItem('n8n_config');
    if (saved) {
      try {
        setN8nConfig(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading config", e);
      }
    }
  }, []);

  const handleSaveConfig = (config: N8nConnectionConfig) => {
    setN8nConfig(config);
    localStorage.setItem('n8n_config', JSON.stringify(config));
  };

  const handleSendMessage = async (text: string) => {
    const userMsg: Message = { role: 'user', content: text, timestamp: new Date() };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setIsLoading(true);
    
    // Auto maximize chat if user sends a message
    setIsChatMinimized(false);

    try {
      const response = await sendMessageToGemini(newHistory, text);
      
      const aiMsg: Message = {
        role: 'model',
        content: response.explanation,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMsg]);
      
      if (response.workflow) {
        setCurrentWorkflow(response.workflow);
        setWorkflowCredentials(response.requiredCredentials || []);
        setWorkflowTips(response.tips || []);
        // Switch to preview mode to show the new workflow
        setViewMode('preview');
      }
    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        role: 'model',
        content: "Erro de comunicação. Verifique sua chave API.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-n8n-darker text-gray-100 overflow-hidden font-sans relative">
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveConfig}
        currentConfig={n8nConfig}
      />

      {/* Header */}
      <header className="h-14 bg-[#ff6d5a] flex items-center px-6 shadow-md z-30 justify-between shrink-0">
        <div className="flex items-center gap-2">
            <div className="bg-white p-1 rounded-full">
               <Workflow className="text-[#ff6d5a] w-5 h-5" />
            </div>
            <h1 className="text-white font-bold text-xl tracking-tight hidden sm:block">N8N Architect AI</h1>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex bg-[#e05644] p-1 rounded-lg">
            <button
                onClick={() => setViewMode('preview')}
                className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium transition-all ${viewMode === 'preview' ? 'bg-white text-[#ff6d5a] shadow-sm' : 'text-white/80 hover:text-white'}`}
            >
                <Monitor size={16} />
                <span className="hidden sm:inline">IA Preview</span>
            </button>
            <button
                onClick={() => setViewMode('live')}
                className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium transition-all ${viewMode === 'live' ? 'bg-white text-[#ff6d5a] shadow-sm' : 'text-white/80 hover:text-white'}`}
            >
                <Globe size={16} />
                <span className="hidden sm:inline">Meu N8N</span>
            </button>
        </div>

        <div className="flex items-center gap-2">
             <button 
                onClick={() => setIsSettingsOpen(true)}
                className={`p-2 rounded-full transition-colors ${n8nConfig ? 'text-white hover:bg-white/20' : 'text-yellow-200 bg-white/10 hover:bg-white/20'}`}
                title="Configurar Conexão N8N"
             >
                <Settings size={20} />
             </button>
        </div>
      </header>

      {/* Main Content Area (Layers) */}
      <main className="flex-1 relative w-full h-full overflow-hidden bg-[#1a202c]">
        
        {/* LAYER 1: Preview Mode (Workflow Visualizer) */}
        <div className={`absolute inset-0 z-10 transition-opacity duration-300 ${viewMode === 'preview' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
             <WorkflowPreview 
                workflow={currentWorkflow} 
                credentials={workflowCredentials}
                tips={workflowTips}
                n8nConfig={n8nConfig}
                onOpenSettings={() => setIsSettingsOpen(true)}
            />
        </div>

        {/* LAYER 2: Live Mode (Iframe) */}
        <div className={`absolute inset-0 z-10 bg-white transition-opacity duration-300 flex flex-col ${viewMode === 'live' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
            {n8nConfig?.baseUrl ? (
                <>
                    <iframe 
                        src={n8nConfig.baseUrl} 
                        className="w-full h-full border-none"
                        title="N8N Instance"
                        onError={(e) => console.error("Iframe load error", e)}
                    />
                    <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded shadow opacity-50 hover:opacity-100 transition-opacity z-20 pointer-events-none">
                        Se a tela estiver branca, o N8N bloqueou a conexão (X-Frame-Options).
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 bg-gray-900">
                    <Globe size={64} className="mb-4 opacity-20" />
                    <h3 className="text-xl font-medium text-gray-400">Instância não conectada</h3>
                    <p className="mt-2 text-sm text-gray-500 mb-6">Configure a URL do seu N8N para visualizá-lo aqui.</p>
                    <button 
                        onClick={() => setIsSettingsOpen(true)}
                        className="bg-n8n-primary hover:bg-n8n-hover text-white px-4 py-2 rounded-md font-medium transition-colors"
                    >
                        Configurar Agora
                    </button>
                </div>
            )}
        </div>
      </main>

      {/* Footer Chat Widget - Floating/Docked */}
      <div 
        className={`absolute right-4 bottom-0 z-40 transition-all duration-300 ease-in-out flex flex-col shadow-2xl ${
            isChatMinimized ? 'w-64 h-12' : 'w-[90%] md:w-[450px] h-[500px] max-h-[80vh]'
        }`}
      >
        <ChatInterface 
            messages={messages} 
            isLoading={isLoading} 
            onSendMessage={handleSendMessage}
            isMinimized={isChatMinimized}
            onToggleMinimize={() => setIsChatMinimized(!isChatMinimized)}
        />
      </div>

    </div>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
