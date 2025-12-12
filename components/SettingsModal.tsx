import React, { useState, useEffect } from 'react';
import { X, Save, Server, Key, Loader2, AlertCircle } from 'lucide-react';
import { N8nConnectionConfig, validateN8nConnection } from '../services/n8nApiService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: N8nConnectionConfig) => void;
  currentConfig: N8nConnectionConfig | null;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, currentConfig }) => {
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && currentConfig) {
      setBaseUrl(currentConfig.baseUrl);
      setApiKey(currentConfig.apiKey);
      setError(null);
    }
  }, [isOpen, currentConfig]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsValidating(true);

    let formattedUrl = baseUrl.trim();
    if (!formattedUrl.startsWith('http')) {
        formattedUrl = `https://${formattedUrl}`;
    }
    formattedUrl = formattedUrl.replace(/\/$/, "");

    const newConfig = { baseUrl: formattedUrl, apiKey: apiKey.trim() };

    // Validate before saving
    const isValid = await validateN8nConnection(newConfig);
    
    setIsValidating(false);

    if (isValid) {
        onSave(newConfig);
        onClose();
    } else {
        setError("Não foi possível conectar. Verifique a URL e a API Key.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Server className="text-n8n-primary" size={20} />
            Conectar Instância N8N
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-sm text-blue-200 bg-blue-900/20 border border-blue-900/50 p-3 rounded mb-4">
            Configure sua instância para permitir salvar workflows diretamente.
            <br />
            <span className="text-xs opacity-70 block mt-1">
              Nota: Sua instância deve permitir CORS se estiver hospedada em domínio diferente.
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">URL da Instância</label>
            <div className="relative">
                <input
                    type="url"
                    required
                    placeholder="https://seu-n8n.com"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 rounded-md py-2 pl-3 pr-10 text-white focus:ring-1 focus:ring-n8n-primary focus:border-n8n-primary outline-none"
                    disabled={isValidating}
                />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">API Key</label>
            <div className="relative">
                <Key className="absolute left-3 top-2.5 text-gray-500" size={16} />
                <input
                    type="password"
                    required
                    placeholder="n8n_api_..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 rounded-md py-2 pl-10 pr-3 text-white focus:ring-1 focus:ring-n8n-primary focus:border-n8n-primary outline-none"
                    disabled={isValidating}
                />
            </div>
            <p className="text-xs text-gray-500 mt-1">Configurações &gt; API &gt; Criar Chave API</p>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-red-300 text-xs bg-red-900/20 p-2 rounded border border-red-800/50">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{error}</span>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isValidating}
              className="px-4 py-2 rounded-md text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isValidating}
              className={`px-4 py-2 rounded-md text-sm bg-n8n-primary hover:bg-n8n-hover text-white font-medium flex items-center gap-2 shadow-lg shadow-n8n-primary/20 ${isValidating ? 'opacity-70 cursor-wait' : ''}`}
            >
              {isValidating ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              {isValidating ? 'Testando...' : 'Salvar Conexão'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};