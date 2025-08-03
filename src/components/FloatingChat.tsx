"use client";

import { useState, useRef, useEffect } from "react";
// Using emoji/text icons instead of lucide-react to avoid extra dependency

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AISession {
  surah: string;
  verses: string;
  duration: number;
  mistakes: string[];
  performance: number;
  notes: string;
}

interface FloatingChatProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function FloatingChat({ isOpen, onToggle }: FloatingChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Assalam Alaikum! 📖 I'm your AI Quran Coach. How did your practice session go today? Tell me about what you recited, any mistakes you noticed, and how you felt about your performance.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [extractedSession, setExtractedSession] = useState<AISession | null>(
    null
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Get JWT token from localStorage (same as current implementation)
      const token = localStorage.getItem("sb-scqseishklizofqtddxr-auth-token");
      let accessToken = null;

      if (token) {
        try {
          const parsedToken = JSON.parse(token);
          accessToken = parsedToken.access_token;
        } catch (e) {
          console.error("Error parsing token:", e);
        }
      }

      if (!accessToken) {
        throw new Error("No valid authentication token found");
      }

      // Build conversation history for context
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp.toISOString(),
      }));

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: input.trim(),
          context: conversationHistory,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "Sorry, I couldn't generate a response.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "❌ Sorry, I encountered an error. Please make sure you're signed in and try again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render anything if not open
  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onToggle} />

      {/* Floating Chat Container */}
      <div className="fixed bottom-4 right-4 z-50">
        <div
          className={`
            bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 
            transition-all duration-300 ease-in-out
            ${isMinimized ? "w-80 h-16" : "w-96 h-[600px]"}
          `}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 bg-emerald-50 dark:bg-emerald-900/20 rounded-t-xl">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                <span className="text-emerald-600 dark:text-emerald-400 text-sm">
                  🤖
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                  AI Quran Coach
                </h3>
                {!isMinimized && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Powered by Gemini AI
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                title={isMinimized ? "Maximize" : "Minimize"}
              >
                {isMinimized ? (
                  <span className="text-gray-500 text-sm">▢</span>
                ) : (
                  <span className="text-gray-500 text-sm">−</span>
                )}
              </button>
              <button
                onClick={onToggle}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                title="Close"
              >
                <span className="text-gray-500 text-sm">✕</span>
              </button>
            </div>
          </div>

          {/* Chat Content - Only show when not minimized */}
          {!isMinimized && (
            <>
              {/* Messages Container */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-3 h-[calc(100%-140px)]"
              >
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[280px] px-3 py-2 rounded-lg text-sm ${
                        message.role === "user"
                          ? "bg-emerald-600 text-white rounded-br-sm"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">
                        {message.content}
                      </div>
                      <div
                        className={`text-xs mt-1 ${
                          message.role === "user"
                            ? "text-emerald-100"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg rounded-bl-sm max-w-[280px]">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">
                          AI is thinking...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-3 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-750 rounded-b-xl">
                <div className="flex space-x-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Tell me about your Quran session..."
                    className="flex-1 resize-none border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white text-sm"
                    rows={2}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isLoading}
                    className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// Chat Toggle Button Component
export function ChatToggleButton({
  onClick,
  isOpen,
}: {
  onClick: () => void;
  isOpen: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        fixed bottom-4 right-4 z-40 w-14 h-14 rounded-full shadow-lg 
        transition-all duration-300 hover:scale-110 focus:ring-4 focus:ring-emerald-500/30
        ${
          isOpen
            ? "bg-gray-600 text-white"
            : "bg-emerald-600 text-white hover:bg-emerald-700"
        }
      `}
      title={isOpen ? "Close Chat" : "Open AI Coach"}
    >
      {isOpen ? (
        <span className="text-xl">✕</span>
      ) : (
        <span className="text-xl">💬</span>
      )}
    </button>
  );
}
