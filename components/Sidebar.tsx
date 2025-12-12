import React from 'react';
import { ChatSession } from '../types';
import { MessageSquareIcon, PlusIcon, TrashIcon, XMarkIcon, SettingsIcon } from './Icons';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (e: React.MouseEvent, id: string) => void;
  onOpenSettings: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSessionId,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  onOpenSettings,
  isOpen,
  onClose
}) => {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Content */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-72 bg-gray-900 text-gray-100 flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-gray-800">
          <h2 className="font-semibold text-lg tracking-tight">历史对话</h2>
          <button 
            onClick={onClose}
            className="md:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
          >
            <XMarkIcon />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl transition-all shadow-lg hover:shadow-blue-900/50 group"
          >
            <PlusIcon />
            <span className="font-medium">开启新对话</span>
          </button>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1 scrollbar-thin scrollbar-thumb-gray-700">
          {sessions.length === 0 ? (
            <div className="text-center text-gray-500 py-8 text-sm">
              暂无历史记录
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => {
                  onSelectSession(session.id);
                  if (window.innerWidth < 768) onClose();
                }}
                className={`
                  group relative flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors
                  ${session.id === currentSessionId 
                    ? 'bg-gray-800 text-white' 
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'}
                `}
              >
                <MessageSquareIcon />
                <div className="flex-1 truncate text-sm">
                  {session.title || '新对话'}
                </div>
                
                {/* Delete Button */}
                <button
                  onClick={(e) => onDeleteSession(e, session.id)}
                  className={`
                    p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-gray-700 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100
                  `}
                  title="删除对话"
                >
                  <TrashIcon />
                </button>
              </div>
            ))
          )}
        </div>
        
        {/* Footer */}
        <div className="p-2 border-t border-gray-800">
           <button 
              onClick={() => {
                  onOpenSettings();
                  if (window.innerWidth < 768) onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-3 text-gray-400 hover:bg-gray-800 hover:text-gray-200 rounded-lg transition-colors"
           >
              <SettingsIcon />
              <span className="text-sm font-medium">设置 (Settings)</span>
           </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;