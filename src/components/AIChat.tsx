"use client";

import { useState, useRef, useEffect } from "react";

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

export default function AIChat() {
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

  // Auto-scroll when new messages are added
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      const isScrolledToBottom =
        container.scrollHeight - container.clientHeight <=
        container.scrollTop + 1;
      if (isScrolledToBottom) {
        scrollToBottom();
      }
    }
  }, [messages]);

  const getAIResponse = async (
    userMessage: string,
    conversationHistory: Message[]
  ): Promise<string> => {
    try {
      // Prepare conversation context for the AI
      const context = conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Call our Next.js AI chat API
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${
            (
              await (await import("@/lib/supabase")).supabase.auth.getSession()
            ).data.session?.access_token || ""
          }`,
        },
        body: JSON.stringify({
          message: userMessage,
          context: context,
          session_type: "quran_coaching",
          system_prompt: `You are an AI Quran Coach helping users track their practice sessions. 
          You should:
          1. Ask follow-up questions to gather session details (Surah, duration, mistakes, performance)
          2. Provide specific Tajweed and pronunciation guidance
          3. Be encouraging and supportive
          4. Help users identify areas for improvement
          5. Use Islamic greetings and terminology appropriately
          
          When you have enough information, help extract: Surah name, practice duration, mistakes made, performance rating, and any specific areas to improve.`,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      // Return the AI response
      return (
        data.response ||
        data.message ||
        "I apologize, but I'm having trouble processing your message. Could you please try again?"
      );
    } catch (error) {
      console.error("Error calling AI API:", error);

      // Fallback to contextual response if API fails
      return getContextualFallback(userMessage, conversationHistory);
    }
  };

  const getContextualFallback = (
    userMessage: string,
    history: Message[]
  ): string => {
    const message = userMessage.toLowerCase();
    const lastMessages = history
      .slice(-3)
      .map((m) => m.content.toLowerCase())
      .join(" ");

    // More intelligent fallback based on conversation context
    if (message.includes("fatiha") || message.includes("al-fatiha")) {
      if (
        lastMessages.includes("mistake") ||
        lastMessages.includes("pronunciation")
      ) {
        return "I see you mentioned Al-Fatiha and some pronunciation challenges. The letter ص (Saad) in 'صِرَاطَ' should be pronounced with emphasis from the back of the tongue. Would you like specific exercises to practice this sound?";
      }
      return "Excellent choice practicing Al-Fatiha! How did you find the Tajweed rules, especially in verses like 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ'?";
    }

    if (
      message.includes("saad") ||
      message.includes("صِرَاطَ") ||
      message.includes("siraat")
    ) {
      return "The ص (Saad) sound is indeed tricky! It's an emphatic letter that should be pronounced with the back of the tongue touching the roof of the mouth. Try practicing: صَا صِي صُو. How long did you practice today?";
    }

    if (message.includes("mistake") || message.includes("error")) {
      return "That's excellent self-awareness! Identifying mistakes is the first step to improvement. Could you describe exactly where you struggled? Was it with the makhraj (articulation point) or sifaat (characteristics) of the letter?";
    }

    if (message.includes("confident") || message.includes("good")) {
      return "Alhamdulillah! Confidence comes with practice. Since you mentioned feeling good overall, could you rate your performance today on a scale of 1-10? And how much time did you spend practicing?";
    }

    return "Thank you for sharing that detail! To help me understand your session better, could you tell me: which Surah you practiced, how long you spent, and any specific challenges you faced?";
  };

  const extractSessionData = (messages: Message[]): AISession | null => {
    const text = messages
      .map((m) => m.content)
      .join(" ")
      .toLowerCase();

    // Enhanced extraction with more patterns
    const session: AISession = {
      surah: "",
      verses: "",
      duration: 0,
      mistakes: [],
      performance: 0,
      notes: "",
    };

    // Extract Surah with more variations
    if (text.includes("fatiha") || text.includes("al-fatiha")) {
      session.surah = "Al-Fatiha";
    } else if (text.includes("baqarah") || text.includes("al-baqarah")) {
      session.surah = "Al-Baqarah";
    } else if (text.includes("ikhlas") || text.includes("al-ikhlas")) {
      session.surah = "Al-Ikhlas";
    } else if (text.includes("nas") || text.includes("an-nas")) {
      session.surah = "An-Nas";
    } else if (text.includes("falaq") || text.includes("al-falaq")) {
      session.surah = "Al-Falaq";
    }

    // Extract duration with more patterns
    const timeMatch = text.match(/(\d+)\s*(minute|hour|min|hr)/);
    if (timeMatch) {
      const value = parseInt(timeMatch[1]);
      session.duration =
        timeMatch[2].includes("hour") || timeMatch[2].includes("hr")
          ? value * 60
          : value;
    }

    // Extract performance ratings
    const perfMatch = text.match(/(\d+)\s*(\/10|out of 10|scale|rating)/);
    if (perfMatch) {
      session.performance = parseInt(perfMatch[1]) / 10;
    }

    // Extract mistakes
    if (
      text.includes("mistake") ||
      text.includes("error") ||
      text.includes("struggle")
    ) {
      if (text.includes("saad") || text.includes("ص")) {
        session.mistakes.push("Pronunciation of Saad (ص) letter");
      }
      if (text.includes("pronunciation")) {
        session.mistakes.push("General pronunciation issues");
      }
      if (text.includes("tajweed")) {
        session.mistakes.push("Tajweed rule application");
      }
    }

    // Return session if we have meaningful data
    if (session.surah || session.duration > 0 || session.mistakes.length > 0) {
      return session;
    }

    return null;
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    try {
      // Get AI response with full conversation context
      const conversationContext = [...messages, userMessage];
      const aiResponse = await getAIResponse(currentInput, conversationContext);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => {
        const newMessages = [...prev, assistantMessage];

        // Try to extract session data from updated conversation
        const sessionData = extractSessionData(newMessages);
        if (sessionData) {
          setExtractedSession(sessionData);
        }

        return newMessages;
      });
    } catch (error) {
      console.error("Error getting AI response:", error);

      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I apologize, but I'm experiencing some technical difficulties. Please try your message again, or let me know if you'd like to continue with basic session tracking.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const saveSession = async () => {
    if (!extractedSession) return;

    try {
      // Call your backend API to save the session
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/sessions/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${
              (
                await (
                  await import("@/lib/supabase")
                ).supabase.auth.getSession()
              ).data.session?.access_token || ""
            }`,
          },
          body: JSON.stringify({
            duration: extractedSession.duration || 10,
            performance_score: extractedSession.performance || 0.7,
            notes: `${
              extractedSession.surah
                ? "Surah: " + extractedSession.surah + ". "
                : ""
            }${
              extractedSession.mistakes.length
                ? "Mistakes: " + extractedSession.mistakes.join(", ") + ". "
                : ""
            }${extractedSession.notes}`.trim(),
            session_type: "practice",
            goal_description: `Practice ${extractedSession.surah || "Quran"}`,
          }),
        }
      );

      if (response.ok) {
        // Add success message
        const successMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: `Perfect! I've logged your session: ${extractedSession.surah} practice for ${extractedSession.duration} minutes with ${extractedSession.mistakes.length} areas to improve. Your progress is being tracked. Keep up the excellent work! 📈`,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, successMessage]);
        setExtractedSession(null);
      } else {
        throw new Error("Failed to save session");
      }
    } catch (error) {
      console.error("Error saving session:", error);

      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content:
          "I encountered an issue saving your session to the database. Don't worry - I still have the details and you can try saving again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-xl shadow-lg max-h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
            <span className="text-emerald-600 dark:text-emerald-400 text-lg">
              🤖
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              AI Quran Coach
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Powered by Gemini AI
            </p>
          </div>
        </div>
        {extractedSession && (
          <button
            onClick={saveSession}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
          >
            Save Session
          </button>
        )}
      </div>

      {/* Messages Container - Fixed height with scroll */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
        style={{ maxHeight: "calc(100% - 200px)" }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.role === "user"
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              <span className="text-xs opacity-70 mt-1 block">
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
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
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Session Preview */}
      {extractedSession && (
        <div className="mx-4 mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800 flex-shrink-0">
          <h4 className="font-medium text-emerald-800 dark:text-emerald-200 mb-2">
            📋 Session Summary
          </h4>
          <div className="text-sm text-emerald-700 dark:text-emerald-300 space-y-1">
            {extractedSession.surah && (
              <p>
                <strong>Surah:</strong> {extractedSession.surah}
              </p>
            )}
            {extractedSession.duration > 0 && (
              <p>
                <strong>Duration:</strong> {extractedSession.duration} minutes
              </p>
            )}
            {extractedSession.performance > 0 && (
              <p>
                <strong>Performance:</strong>{" "}
                {(extractedSession.performance * 100).toFixed(0)}%
              </p>
            )}
            {extractedSession.mistakes.length > 0 && (
              <p>
                <strong>Areas to improve:</strong>{" "}
                {extractedSession.mistakes.join(", ")}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t dark:border-gray-700 flex-shrink-0">
        <div className="flex space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Tell me about your Quran session..."
            className="flex-1 resize-none border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
            rows={2}
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
