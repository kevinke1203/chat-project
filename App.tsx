import React, { useState, useRef, useEffect } from 'react';
import { parseDocx } from './utils/docParser';
import { sendMessageToAI } from './services/geminiService';
import { Message, Role, Attachment, ChatSession, AppSettings } from './types';
import MessageItem from './components/MessageItem';
import TypingIndicator from './components/TypingIndicator';
import Sidebar from './components/Sidebar';
import SettingsModal from './components/SettingsModal';
import { SendIcon, PaperClipIcon, XMarkIcon, FileIcon, MenuIcon } from './components/Icons';

const STORAGE_KEY = 'gemini-chat-history-v1';
const SETTINGS_KEY = 'gemini-app-settings-v2'; // Bump version for new schema

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const createNewSession = (): ChatSession => ({
  id: generateId(),
  title: '新对话',
  messages: [
    {
      id: 'welcome',
      role: Role.MODEL,
      text: '你好！我是你的 AI 助手。我可以帮你分析文档或回答问题。请上传 Word 文档或直接向我提问。',
      timestamp: Date.now()
    }
  ],
  updatedAt: Date.now()
});

const DEFAULT_SETTINGS: AppSettings = {
    provider: 'gemini',
    apiKey: '',
    modelName: 'gemini-3-pro-preview',
    baseUrl: ''
};

const App: React.FC = () => {
  // --- State Management ---
  
  // Settings
  const [settings, setSettings] = useState<AppSettings>(() => {
      try {
          const saved = localStorage.getItem(SETTINGS_KEY);
          if (saved) {
              const parsed = JSON.parse(saved);
              // Migrate old settings if needed (check if provider exists)
              if (!parsed.provider) {
                  return { ...DEFAULT_SETTINGS, ...parsed, provider: 'gemini' };
              }
              return parsed;
          }
          return DEFAULT_SETTINGS;
      } catch (e) {
          return DEFAULT_SETTINGS;
      }
  });

  // Sessions
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to load history", e);
    }
    return [createNewSession()];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    return sessions.length > 0 ? sessions[0].id : '';
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derived state
  const currentSession = sessions.find(s => s.id === currentSessionId) || sessions[0];
  const messages = currentSession?.messages || [];

  // --- Effects ---

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, currentSessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // --- Handlers ---

  const handleSaveSettings = (newSettings: AppSettings) => {
      setSettings(newSettings);
      setIsSettingsOpen(false);
  };

  const handleNewChat = () => {
    const newSession = createNewSession();
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setInput('');
    setAttachment(null);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      const newSession = createNewSession();
      setSessions([newSession]);
      setCurrentSessionId(newSession.id);
      return;
    }
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    if (id === currentSessionId) {
      setCurrentSessionId(newSessions[0].id);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
      alert("请上传 Word 文档 (.docx)");
      return;
    }

    setIsProcessingFile(true);
    try {
      const content = await parseDocx(file);
      setAttachment({
        name: file.name,
        content: content,
        type: 'file'
      });
      e.target.value = '';
    } catch (error) {
      alert("无法读取文件内容，请确保文档未损坏。");
      console.error(error);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const clearAttachment = () => {
    setAttachment(null);
  };

  const updateCurrentSession = (updater: (session: ChatSession) => ChatSession) => {
    setSessions(prev => prev.map(s => s.id === currentSessionId ? updater(s) : s));
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachment) || isLoading) return;

    const userText = input.trim();
    const currentAttachment = attachment;
    
    setInput('');
    setAttachment(null);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text: userText,
      timestamp: Date.now(),
      attachments: currentAttachment ? [currentAttachment] : undefined
    };

    setIsLoading(true);

    updateCurrentSession(session => {
        let newTitle = session.title;
        if (session.messages.length === 1 && session.title === '新对话') {
            newTitle = userText.slice(0, 20) || (currentAttachment ? '文档分析' : '新对话');
        }
        return {
            ...session,
            title: newTitle,
            messages: [...session.messages, userMessage],
            updatedAt: Date.now()
        };
    });

    try {
      const historyForApi = [...messages, userMessage];

      const responseText = await sendMessageToAI(
        historyForApi, 
        userText,
        currentAttachment?.content,
        settings // Pass dynamic settings
      );

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.MODEL,
        text: responseText,
        timestamp: Date.now()
      };

      updateCurrentSession(session => ({
        ...session,
        messages: [...session.messages, aiMessage],
        updatedAt: Date.now()
      }));

      // In-place update for sort order next render
      setSessions(prev => prev.map(s => s.id === currentSessionId ? {
          ...s,
          messages: [...s.messages, aiMessage],
          updatedAt: Date.now()
      } : s));

    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.MODEL,
        text: error.message || "抱歉，连接服务器时出现错误，请稍后重试。",
        timestamp: Date.now(),
        isError: true
      };
      
      updateCurrentSession(session => ({
        ...session,
        messages: [...session.messages, errorMessage]
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const sortedSessions = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentSettings={settings}
        onSave={handleSaveSettings}
      />

      <Sidebar 
        sessions={sortedSessions}
        currentSessionId={currentSessionId}
        onNewChat={handleNewChat}
        onSelectSession={setCurrentSessionId}
        onDeleteSession={handleDeleteSession}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full w-full relative transition-all duration-300">
        
        {/* Header */}
        <header className="flex-none bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden mr-1 text-gray-500 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100"
              >
                <MenuIcon />
              </button>

              <div className={`
                w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0
                ${settings.provider === 'openai' ? 'bg-gradient-to-tr from-green-600 to-emerald-600' : 'bg-gradient-to-tr from-blue-600 to-indigo-600'}
              `}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                      <path d="M11.25 4.533A9.707 9.707 0 0 0 6 3a9.735 9.735 0 0 0-3.25.555.75.75 0 0 0-.5.707v14.25a.75.75 0 0 0 1 .707A8.237 8.237 0 0 1 6 18.75c1.995 0 3.823.707 5.25 1.886V4.533ZM12.75 20.636A8.214 8.214 0 0 1 18 18.75c.966 0 1.89.166 2.75.47a.75.75 0 0 0 1-.708V4.262a.75.75 0 0 0-.5-.707A9.735 9.735 0 0 0 18 3a9.707 9.707 0 0 0-5.25 1.533v16.103Z" />
                  </svg>
              </div>
              <div className="min-w-0">
                  <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                    <span className="truncate">AI Chat</span>
                    <span className={`hidden sm:inline-block font-normal text-sm px-2 py-0.5 rounded-full ${
                        settings.provider === 'openai' ? 'text-green-600 bg-green-50' : 'text-blue-600 bg-blue-50'
                    }`}>
                        {settings.modelName}
                    </span>
                  </h1>
                  <p className="text-xs text-gray-500 truncate">
                      {currentSession.title}
                  </p>
              </div>
          </div>
        </header>

        {/* Chat Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth bg-gray-50/50">
          <div className="max-w-3xl mx-auto space-y-2">
            {messages.map((msg) => (
              <MessageItem key={msg.id} message={msg} />
            ))}
            {isLoading && (
              <div className="flex w-full justify-start mb-6">
                 <div className="flex gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 ${
                        settings.provider === 'openai' ? 'bg-emerald-600' : 'bg-blue-600'
                    }`}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 animate-pulse">
                          <path d="M12 7v4" />
                          <rect x="3" y="11" width="18" height="10" rx="2" />
                          <circle cx="12" cy="5" r="2" />
                      </svg>
                    </div>
                    <TypingIndicator />
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* Input Area */}
        <footer className="flex-none bg-white p-4 border-t border-gray-200">
          <div className="max-w-3xl mx-auto">
            
            {/* Attachment Preview */}
            {attachment && (
              <div className="mb-3 flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl animate-fade-in-up w-fit">
                <div className="bg-white p-2 rounded-lg shadow-sm text-blue-600">
                  <FileIcon />
                </div>
                <div className="flex flex-col min-w-0">
                   <span className="text-sm font-medium text-gray-700 max-w-[200px] truncate">{attachment.name}</span>
                   <span className="text-xs text-gray-500">已准备发送</span>
                </div>
                <button 
                  onClick={clearAttachment}
                  className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <XMarkIcon />
                </button>
              </div>
            )}

            {/* Input Bar */}
            <div className="relative flex items-end gap-2 bg-gray-100 p-2 rounded-3xl border border-transparent focus-within:border-blue-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100 transition-all duration-200">
              
              <input 
                  type="file" 
                  ref={fileInputRef}
                  accept=".docx,.doc"
                  className="hidden"
                  onChange={handleFileChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingFile || isLoading}
                className={`p-3 rounded-full flex-shrink-0 transition-colors ${
                   isProcessingFile 
                   ? 'bg-gray-200 cursor-wait' 
                   : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                }`}
                title="Upload Word Document"
              >
                {isProcessingFile ? (
                   <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <PaperClipIcon />
                )}
              </button>

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="发送消息..."
                className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-32 py-3 text-gray-700 placeholder-gray-400"
                rows={1}
                style={{ minHeight: '44px' }}
                disabled={isLoading}
              />

              <button
                onClick={handleSend}
                disabled={(!input.trim() && !attachment) || isLoading}
                className={`p-3 rounded-full flex-shrink-0 mb-[1px] transition-all duration-200 shadow-sm ${
                  (!input.trim() && !attachment) || isLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md hover:scale-105 active:scale-95'
                }`}
              >
                <SendIcon />
              </button>
            </div>
            <p className="text-center text-xs text-gray-400 mt-2">
              支持 Word 文档解析。聊天记录及设置仅保存在本地。
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;