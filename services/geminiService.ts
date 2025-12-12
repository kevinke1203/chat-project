import OpenAI from "openai";
import { Message, AppSettings, Role } from "../types";

export const sendMessageToAI = async (
  history: Message[],
  currentMessage: string,
  attachedContext?: string,
  settings?: AppSettings
): Promise<string> => {
  // 1. Resolve Settings
  const currentSettings = settings || { 
      provider: 'gemini', 
      apiKey: process.env.API_KEY || '', 
      modelName: 'gemini-3-pro-preview', 
      baseUrl: '' 
  };

  const apiKey = currentSettings.apiKey;
  if (!apiKey) {
      throw new Error("Missing API Key. Please configure it in Settings.");
  }

  // 2. Determine Base URL
  let baseURL = currentSettings.baseUrl;
  if (!baseURL) {
      if (currentSettings.provider === 'gemini') {
          // Use Google's OpenAI-compatible endpoint
          baseURL = "https://generativelanguage.googleapis.com/v1beta/openai/";
      } else {
          // Default OpenAI endpoint
          baseURL = "https://api.openai.com/v1";
      }
  }

  // Ensure no trailing slash for cleanliness (OpenAI lib usually handles this, but good practice)
  baseURL = baseURL.replace(/\/$/, '');

  // 3. Initialize OpenAI Client
  const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: baseURL,
      dangerouslyAllowBrowser: true // Required for client-side usage
  });

  // 4. Construct Messages
  const messages: any[] = [
      {
          role: "system",
          content: "You are a helpful AI assistant capable of analyzing documents. Answer in Chinese unless requested otherwise."
      }
  ];

  // Map history
  history.forEach(msg => {
      if (msg.isError) return;
      
      let content = msg.text;
      // Inject context into the message if it had an attachment
      if (msg.attachments && msg.attachments.length > 0) {
          content = `[Context from file: ${msg.attachments[0].name}]\n${msg.attachments[0].content}\n\n${msg.text}`;
      }

      messages.push({
          role: msg.role === Role.MODEL ? "assistant" : "user",
          content: content
      });
  });

  // Prepare current user message
  let finalContent = currentMessage;
  if (attachedContext) {
      finalContent = `[Document Content Follows]\n${attachedContext}\n\n[User Query]\n${currentMessage}`;
  }
  messages.push({ role: "user", content: finalContent });

  // 5. Send Request
  try {
      const completion = await openai.chat.completions.create({
          model: currentSettings.modelName,
          messages: messages,
          temperature: 0.7,
      });

      return completion.choices[0]?.message?.content || "No response generated.";

  } catch (error: any) {
      console.error("AI API Error:", error);
      
      let errorMessage = error.message || "Unknown error";
      if (errorMessage.includes("401")) {
          errorMessage = "Authentication failed (401). Please check your API Key.";
      } else if (errorMessage.includes("404")) {
          errorMessage = "Model or Endpoint not found (404). Check your Model Name and Base URL.";
      }

      throw new Error(`请求失败: ${errorMessage}`);
  }
};