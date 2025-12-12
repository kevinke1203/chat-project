export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface Attachment {
  name: string;
  content: string; // The extracted text content
  type: 'file';
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: number;
  attachments?: Attachment[];
  isError?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
}

export type ModelProvider = 'gemini' | 'openai';

export interface AppSettings {
  provider: ModelProvider;
  apiKey: string;
  modelName: string;
  baseUrl: string;
}