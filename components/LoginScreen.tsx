import React, { useState } from 'react';
import { Server, Key, ArrowRight, ExternalLink, Workflow, Loader2, AlertCircle } from 'lucide-react';
import { N8nConnectionConfig, validateN8nConnection } from '../services/n8nApiService';

interface LoginScreenProps {
  onLogin: (config: N8nConnectionConfig) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!baseUrl || !apiKey) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    let formattedUrl = baseUrl.trim();
    // Basic cleanup
    if (!formattedUrl.startsWith('http')) {
        formattedUrl = `https://${formattedUrl}`;
    }
    // Remove trailing slash
    formattedUrl = formattedUrl.replace(/\/$/, "");

    const config = { baseUrl: formattedUrl, apiKey: apiKey.trim() };

    setIsValidating(true);
    try {
        const isValid = await validateN8nConnection(config);
        if (isValid) {
            onLogin(config);
        } else {
            setError('Não foi possível conectar. Verifique a URL e a API Key. Certifique-se de que sua instância n8n está acessível.');
        }
    } catch (err) {
        setError('Erro de conexão. Verifique se o n8n está rodando e acessível.');
    } finally {
        setIsValidating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#111827] p-6 relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-[#ff6d5a] rounded-full blur-[120px]"></div>
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] bg-blue-900 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-md bg-[#1a202c] border border-gray-700 rounded-2xl shadow-2xl z-10 p-8">
        <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-[#ff6d5a]/10 rounded-2xl flex items-center justify-center mb-4 border border-[#ff6d5a]/20">
                <Workflow className="text-[#ff6d5a] w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">N8N Architect AI</h1>
            <p className="text-gray-400 text-sm mt-2 text-center">
                Conecte-se à sua instância para começar a criar automações com inteligência artificial.
            </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">URL da Instância</label>
                <div className="relative group">
                    <Server className="absolute left-3 top-3 text-gray-500 group-focus-within:text-[#ff6d5a] transition-colors" size={18} />
                    <input 
                        type="url" 
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                        placeholder="https://n8n.exemplo.com"
                        className="w-full bg-[#111827] border border-gray-600 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-[#ff6d5a]/50 focus:border-[#ff6d5a] outline-none transition-all placeholder-gray-600 disabled:opacity-50"
                        disabled={isValidating}
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">API Key</label>
                <div className="relative group">
                    <Key className="absolute left-3 top-3 text-gray-500 group-focus-within:text-[#ff6d5a] transition-colors" size={18} />
                    <input 
                        type="password" 
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="n8n_api_..."
                        className="w-full bg-[#111827] border border-gray-600 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-[#ff6d5a]/50 focus:border-[#ff6d5a] outline-none transition-all placeholder-gray-600 disabled:opacity-50"
                        disabled={isValidating}
                    />
                </div>
                <div className="flex justify-between mt-2">
                    <span className="text-[10px] text-gray-500">Local: Configurações &gt; API</span>
                </div>
            </div>

            {error && (
                <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-300 text-xs flex items-start gap-2">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <button 
                type="submit"
                disabled={isValidating}
                className={`w-full bg-[#ff6d5a] hover:bg-[#ff8f7e] text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] shadow-lg shadow-[#ff6d5a]/20 ${isValidating ? 'opacity-80 cursor-wait' : ''}`}
            >
                {isValidating ? (
                    <>
                        <Loader2 size={18} className="animate-spin" />
                        Verificando conexão...
                    </>
                ) : (
                    <>
                        Conectar e Acessar
                        <ArrowRight size={18} />
                    </>
                )}
            </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-700 text-center">
            <p className="text-gray-500 text-xs mb-3">Não tem uma instância?</p>
            <a 
                href="https://n8n.io" 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[#ff6d5a] text-sm hover:underline"
            >
                Criar conta no n8n.io <ExternalLink size={12} />
            </a>
        </div>
      </div>
      
      <div className="mt-8 text-gray-600 text-xs text-center max-w-xs">
        Ao conectar, seus dados são salvos apenas localmente no seu navegador.
      </div>
    </div>
  );
};