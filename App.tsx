import React, { useState, useEffect, Component, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { ChatInterface } from './components/ChatInterface';
import { WorkflowPreview } from './components/WorkflowPreview';
import { SettingsModal } from './components/SettingsModal';
import { LoginScreen } from './components/LoginScreen';
import { sendMessageToGemini } from './services/geminiService';
import { N8nConnectionConfig } from './services/n8nApiService';
import { Message, N8nWorkflow } from './types';
import { Workflow, Settings, Globe, Monitor, LogOut, WifiOff, AlertTriangle, RefreshCw } from 'lucide-react';

// --- ERROR BOUNDARY COMPONENT ---
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  handleReset = () => {
      localStorage.removeItem('n8n_config');
      window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#111827] text-white p-6 text-center font-sans">
          <div className="bg-[#1f2937] p-8 rounded-xl border border-red-900/50 shadow-2xl max-w-md w-full">
            <div className="flex justify-center mb-4">
                <div className="bg-red-500/10 p-3 rounded-full">
                    <AlertTriangle className="text-red-500 w-8 h-8" />
                </div>
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Ops! O aplicativo encontrou um erro.</h1>
            <p className="text-gray-400 text-sm mb-6">
                Isso pode ter ocorrido devido a uma falha na renderização ou configuração inválida.
            </p>
            
            <div className="bg-black/30 p-3 rounded text-left mb-6 overflow-hidden">
                <p className="text-red-300 text-xs font-mono break-words">
                    {this.state.error?.message || "Erro desconhecido"}
                </p>
            </div>

            <button 
                onClick={this.handleReset}
                className="w-full bg-[#ff6d5a] hover:bg-[#ff8f7e] text-white py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
                <RefreshCw size={16} />
                Reiniciar Aplicativo
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const App: React.FC = () => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [n8nConfig, setN8nConfig] = useState<N8nConnectionConfig | null>(null);

  // App State
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentWorkflow, setCurrentWorkflow] = useState<N8nWorkflow | null>(null);
  const [workflowCredentials, setWorkflowCredentials] = useState<string[]>([]);
  const [workflowTips, setWorkflowTips] = useState<string[]>([]);
  
  // UI State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'live'>('preview');
  const [isChatMinimized, setIsChatMinimized] = useState(false);

  // Load config on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('n8n_config');
      if (saved) {
        const config = JSON.parse(saved);
        if (config.baseUrl && config.apiKey) {
            setN8nConfig(config);
            setIsAuthenticated(true);
        }
      }
    } catch (e) {
      console.error("Error loading config", e);
      localStorage.removeItem('n8n_config');
    }
  }, []);

  const handleLogin = (config: N8nConnectionConfig | null) => {
    setN8nConfig(config);
    if (config) {
        localStorage.setItem('n8n_config', JSON.stringify(config));
    }
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    if (window.confirm("Deseja desconectar sua instância?")) {
        localStorage.removeItem('n8n_config');
        setN8nConfig(null);
        setIsAuthenticated(false);
        setMessages([]);
        setCurrentWorkflow(null);
    }
  };

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
        content: "Erro de comunicação com a IA. Verifique sua chave API do Gemini.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- RENDER LOGIN SCREEN IF NOT AUTHENTICATED ---
  if (!isAuthenticated) {
    return (
        <ErrorBoundary>
            <LoginScreen onLogin={handleLogin} />
        </ErrorBoundary>
    );
  }

  // --- RENDER MAIN APP ---
  return (
    <ErrorBoundary>
        <div className="h-screen w-screen flex flex-col bg-n8n-darker text-gray-100 overflow-hidden font-sans relative">
        <SettingsModal 
            isOpen={isSettingsOpen} 
            onClose={() => setIsSettingsOpen(false)}
            onSave={handleSaveConfig}
            currentConfig={n8nConfig}
        />

        {/* Header */}
        <header className="h-14 bg-[#ff6d5a] flex items-center px-4 shadow-md z-30 justify-between shrink-0">
            <div className="flex items-center gap-2">
                <div className="bg-white p-1 rounded-full">
                <Workflow className="text-[#ff6d5a] w-5 h-5" />
                </div>
                <h1 className="text-white font-bold text-lg tracking-tight hidden sm:block">N8N Architect</h1>
                {!n8nConfig && (
                    <span className="bg-black/20 text-white/80 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                        <WifiOff size={10} /> Offline
                    </span>
                )}
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex bg-[#e05644] p-1 rounded-lg">
                <button
                    onClick={() => setViewMode('preview')}
                    className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs font-medium transition-all ${viewMode === 'preview' ? 'bg-white text-[#ff6d5a] shadow-sm' : 'text-white/80 hover:text-white'}`}
                >
                    <Monitor size={14} />
                    <span className="hidden sm:inline">IA Preview</span>
                </button>
                <button
                    onClick={() => setViewMode('live')}
                    className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs font-medium transition-all ${viewMode === 'live' ? 'bg-white text-[#ff6d5a] shadow-sm' : 'text-white/80 hover:text-white'}`}
                >
                    <Globe size={14} />
                    <span className="hidden sm:inline">Meu N8N</span>
                </button>
            </div>

            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-2 rounded-full text-white/90 hover:bg-white/20 transition-colors"
                    title="Configurações"
                >
                    <Settings size={18} />
                </button>
                <button 
                    onClick={handleLogout}
                    className="p-2 rounded-full text-white/90 hover:bg-white/20 transition-colors"
                    title="Sair / Desconectar"
                >
                    <LogOut size={18} />
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
                        Painel Live
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 bg-gray-100 gap-4">
                        <div className="bg-white p-6 rounded-xl shadow-sm text-center max-w-sm">
                            <WifiOff size={48} className="mx-auto text-gray-300 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-800">Modo Offline</h3>
                            <p className="text-sm text-gray-500 mt-2">
                                Você não está conectado a uma instância n8n. Configure a conexão nas configurações para acessar o painel ao vivo.
                            </p>
                            <button 
                                onClick={() => setIsSettingsOpen(true)}
                                className="mt-4 text-n8n-primary hover:underline text-sm font-medium"
                            >
                                Conectar agora
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>

        {/* Footer Chat Widget - Floating/Docked */}
        <div 
            className={`absolute right-4 bottom-0 z-40 transition-all duration-300 ease-in-out flex flex-col shadow-2xl ${
                isChatMinimized ? 'w-64 h-12' : 'w-[90%] md:w-[450px] h-[500px] max-h-[85vh]'
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
    </ErrorBoundary>
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