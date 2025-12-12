import React, { useRef, useEffect, useState } from 'react';
import { Message } from '../types';
import { Send, Bot, User, Loader2, Minimize2, Maximize2, X } from 'lucide-react';

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (msg: string) => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  isLoading, 
  onSendMessage,
  isMinimized = false,
  onToggleMinimize
}) => {
  const [input, setInput] = React.useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current && !isMinimized) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isMinimized]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
  };

  if (isMinimized) {
    return (
      <div 
        className="bg-gray-800 border-t border-l border-r border-gray-600 rounded-t-lg shadow-2xl cursor-pointer hover:bg-gray-700 transition-colors flex items-center justify-between px-4 py-3 w-full h-full"
        onClick={onToggleMinimize}
      >
        <div className="flex items-center gap-2">
           <div className="bg-n8n-primary p-1 rounded-full">
             <Bot size={16} className="text-white" />
           </div>
           <span className="font-semibold text-white text-sm">Chat com Arquiteto N8N</span>
           {isLoading && <Loader2 className="animate-spin w-3 h-3 text-gray-400" />}
        </div>
        <button className="text-gray-400 hover:text-white">
          <Maximize2 size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-t-lg shadow-2xl overflow-hidden w-full">
      {/* Header */}
      <div className="p-3 border-b border-gray-700 bg-gray-800/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="text-n8n-primary w-5 h-5" />
          <h2 className="text-sm font-semibold text-white">N8N Architect</h2>
        </div>
        {onToggleMinimize && (
            <button 
                onClick={onToggleMinimize}
                className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700/50"
            >
                <Minimize2 size={18} />
            </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.length === 0 && (
            <div className="text-center text-gray-400 mt-4">
                <p className="text-sm">Como posso ajudar com seu workflow hoje?</p>
            </div>
        )}
        
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[90%] rounded-lg p-3 ${
                msg.role === 'user'
                  ? 'bg-n8n-primary text-white'
                  : 'bg-gray-700/80 text-gray-100 border border-gray-600'
              }`}
            >
              <div className="flex items-center gap-2 mb-1 opacity-70 text-[10px] uppercase tracking-wider">
                <span>{msg.role === 'user' ? 'Você' : 'Agente'}</span>
              </div>
              <div className="whitespace-pre-wrap leading-relaxed text-sm">
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-700/50 rounded-lg p-3 flex items-center gap-2 text-gray-300 border border-gray-600">
              <Loader2 className="animate-spin w-4 h-4" />
              <span className="text-xs">Pensando...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 bg-gray-800/90 border-t border-gray-700 shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1 bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-n8n-primary focus:ring-1 focus:ring-n8n-primary placeholder-gray-500"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-n8n-primary hover:bg-n8n-hover disabled:bg-gray-600 text-white rounded-md px-3 py-2 flex items-center transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
};
