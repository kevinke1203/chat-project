import React, { useState, useEffect } from 'react';
import { AppSettings, ModelProvider } from '../types';
import { XMarkIcon } from './Icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentSettings, onSave }) => {
  const [formData, setFormData] = useState<AppSettings>(currentSettings);

  // Sync state when opening
  useEffect(() => {
    if (isOpen) {
      setFormData(currentSettings);
    }
  }, [isOpen, currentSettings]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleProviderChange = (provider: ModelProvider) => {
    setFormData(prev => ({
        ...prev,
        provider,
        // Set reasonable defaults when switching if the field is empty or default
        baseUrl: provider === 'openai' && !prev.baseUrl ? 'https://api.openai.com/v1' : (provider === 'gemini' && prev.baseUrl === 'https://api.openai.com/v1' ? '' : prev.baseUrl),
        modelName: provider === 'openai' && prev.modelName.includes('gemini') ? 'gpt-4o' : (provider === 'gemini' && !prev.modelName.includes('gemini') ? 'gemini-3-pro-preview' : prev.modelName)
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">设置 (Settings)</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
          >
            <XMarkIcon />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Provider Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              模型服务商 (Provider)
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
                <button
                    type="button"
                    onClick={() => handleProviderChange('gemini')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                        formData.provider === 'gemini' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Google Gemini
                </button>
                <button
                    type="button"
                    onClick={() => handleProviderChange('openai')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                        formData.provider === 'openai' 
                        ? 'bg-white text-green-600 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    OpenAI Compatible
                </button>
            </div>
          </div>

          {/* Model Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              模型名称 (Model Name)
            </label>
            <input
              type="text"
              value={formData.modelName}
              onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
              placeholder={formData.provider === 'gemini' ? "gemini-3-pro-preview" : "gpt-4o, deepseek-chat..."}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <input
              type="password"
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              placeholder={formData.provider === 'gemini' ? "Gemini API Key" : "sk-..."}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
            />
            <p className="mt-1 text-xs text-gray-500">
              Key 仅存储在本地浏览器。
            </p>
          </div>

          {/* Base URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Base URL {formData.provider === 'openai' && <span className="text-gray-400">(必填，如 https://api.openai.com/v1)</span>}
            </label>
            <input
              type="text"
              value={formData.baseUrl}
              onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
              placeholder={formData.provider === 'gemini' ? "Optional proxy URL" : "https://api.openai.com/v1"}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              className={`flex-1 px-4 py-2 text-white rounded-xl transition-colors font-medium shadow-lg ${
                  formData.provider === 'gemini' 
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                  : 'bg-green-600 hover:bg-green-700 shadow-green-600/20'
              }`}
            >
              保存配置
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;