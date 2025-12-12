import React from 'react';
import { Message, Role } from '../types';
import { RobotIcon, UserIcon, FileIcon } from './Icons';

interface MessageItemProps {
  message: Message;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isUser = message.role === Role.USER;

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
        }`}>
          {isUser ? <UserIcon /> : <RobotIcon />}
        </div>

        {/* Bubble */}
        <div className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
          {/* File Attachment Indicator if exists */}
          {message.attachments && message.attachments.length > 0 && (
            <div className={`flex items-center gap-2 p-2 rounded-lg text-sm mb-1 ${
              isUser ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
            }`}>
              <FileIcon />
              <span className="font-medium truncate max-w-[200px]">
                {message.attachments[0].name}
              </span>
              <span className="text-xs opacity-70">(已读取)</span>
            </div>
          )}

          <div
            className={`px-4 py-3 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed whitespace-pre-wrap ${
              isUser
                ? 'bg-blue-600 text-white rounded-tr-none'
                : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
            } ${message.isError ? 'bg-red-50 border-red-200 text-red-600' : ''}`}
          >
            {message.text}
          </div>
          
          <span className="text-xs text-gray-400 px-1">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;