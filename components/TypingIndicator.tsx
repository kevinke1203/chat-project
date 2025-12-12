import React from 'react';

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex space-x-1 items-center p-2 bg-white rounded-2xl rounded-tl-none border border-gray-100 w-fit">
      <div className="w-2 h-2 bg-blue-400 rounded-full typing-dot"></div>
      <div className="w-2 h-2 bg-blue-400 rounded-full typing-dot"></div>
      <div className="w-2 h-2 bg-blue-400 rounded-full typing-dot"></div>
    </div>
  );
};

export default TypingIndicator;