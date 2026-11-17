import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Send,
  Plus,
  MessageSquare,
  Sparkles,
  UserRound,
  LoaderCircle,
  ShoppingBag,
  AlertCircle,
  Menu,
  X,
} from "lucide-react";

import {
  sendChatMessage,
  getConversations,
} from "../../services/aiAssistantService";

import { Link } from "react-router-dom";

function AIAssistantPage() {
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  const loadConversations = async () => {
    try {
      setHistoryLoading(true);
      const data = await getConversations();
      setConversations(data);
    } catch (err) {
      console.error("Conversation history error:", err);
      setError("Could not load conversation history.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const startNewChat = () => {
    setConversationId(null);
    setMessages([]);
    setInput("");
    setError("");
    setSidebarOpen(false);
    inputRef.current?.focus();
  };

  const openConversation = (conversation) => {
    setConversationId(conversation.id);
    setMessages(
      conversation.messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    );
    setError("");
    setSidebarOpen(false);
  };

  const handleSend = async (event) => {
    event.preventDefault();

    const message = input.trim();

    if (!message || loading) return;

    const userMessage = {
      role: "USER",
      content: message,
    };

    setMessages((previous) => [...previous, userMessage]);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const response = await sendChatMessage(message, conversationId);

      setConversationId(response.conversation_id);

      setMessages((previous) => [
        ...previous,
        {
          role: "ASSISTANT",
          content: response.message,
        },
      ]);

      await loadConversations();
    } catch (err) {
      console.error("AI chat error:", err);

      setMessages((previous) => previous.slice(0, -1));

      setInput(message);

      setError(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "Show me rice products",
    "Find pharmacy products",
    "Show me vegetables",
    "Find fruits",
  ];

  return (
    <div className="min-h-[calc(100vh-160px)] bg-[#f7faf7]">
      <div className="mx-auto flex max-w-[1440px] px-3 py-5 sm:px-6 lg:px-8">
        {/* Conversation Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "fixed inset-0 z-[60] flex" : "hidden"
          } lg:relative lg:flex lg:w-80 lg:shrink-0`}
        >
          {sidebarOpen && (
            <div
              className="absolute inset-0 bg-black/40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <div className="relative z-10 flex w-[85%] max-w-80 flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-sm lg:w-full">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-green-100 p-2 text-green-700">
                  <Bot size={22} />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">LocalHub AI</h2>
                  <p className="text-xs text-green-600">Shopping Assistant</p>
                </div>
              </div>

              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
              >
                <X size={20} />
              </button>
            </div>

            <button
              onClick={startNewChat}
              className="flex items-center justify-center gap-2 rounded-xl bg-green-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-green-800"
            >
              <Plus size={18} />
              New Conversation
            </button>

            <div className="mb-3 mt-7 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
              <MessageSquare size={15} />
              Recent Conversations
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto">
              {historyLoading ? (
                <div className="flex justify-center py-8">
                  <LoaderCircle className="animate-spin text-green-700" />
                </div>
              ) : conversations.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-400">
                  No conversations yet.
                </p>
              ) : (
                conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => openConversation(conversation)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${
                      conversationId === conversation.id
                        ? "bg-green-50 text-green-800"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <MessageSquare size={17} className="shrink-0" />
                    <span className="truncate font-medium">
                      {conversation.title || "New conversation"}
                    </span>
                  </button>
                ))
              )}
            </div>

            <div className="mt-4 rounded-xl bg-green-50 p-3">
              <p className="text-xs leading-5 text-green-800">
                Ask LocalHub AI to help you discover products available in our
                store.
              </p>
            </div>
          </div>
        </aside>

        {/* Main Chat */}
        <main className="ml-0 flex min-h-[75vh] min-w-0 flex-1 flex-col lg:ml-5">
          {/* Header */}
          <div className="flex items-center justify-between rounded-t-2xl border border-gray-100 bg-white px-4 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
              >
                <Menu size={20} />
              </button>

              <div className="rounded-xl bg-green-100 p-2.5 text-green-700">
                <Sparkles size={21} />
              </div>

              <div>
                <h1 className="font-bold text-gray-900">
                  AI Shopping Assistant
                </h1>
                <p className="text-xs text-green-600">
                  Here to help you shop smarter
                </p>
              </div>
            </div>

            <span className="hidden items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 sm:flex">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Online
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-6 overflow-y-auto border-x border-gray-100 bg-white px-4 py-6 sm:px-6">
            {messages.length === 0 ? (
              <div className="flex min-h-[55vh] flex-col items-center justify-center text-center">
                <div className="mb-5 rounded-3xl bg-green-100 p-5 text-green-700">
                  <Bot size={42} />
                </div>

                <h2 className="text-xl font-extrabold text-gray-900 sm:text-2xl">
                  What are you looking for?
                </h2>

                <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
                  Tell me what you need. I can help you find products from
                  LocalHub's catalog.
                </p>

                <div className="mt-8 grid w-full max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setInput(suggestion)}
                      className="rounded-xl border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700 transition hover:border-green-400 hover:bg-green-50 hover:text-green-800"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    message.role === "USER" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "ASSISTANT" && (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700">
                      <Bot size={20} />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-7 sm:max-w-[75%] ${
                      message.role === "USER"
                        ? "rounded-br-sm bg-green-700 text-white"
                        : "rounded-bl-sm bg-gray-100 text-gray-800"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>

                  {message.role === "USER" && (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                      <UserRound size={19} />
                    </div>
                  )}
                </div>
              ))
            )}

            {loading && (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-100 text-green-700">
                  <Bot size={20} />
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-3 text-sm text-gray-500">
                  <LoaderCircle size={17} className="animate-spin" />
                  Searching products...
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-600">
                <AlertCircle size={17} />
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="rounded-b-2xl border border-gray-100 bg-white p-4 sm:p-5">
            <form
              onSubmit={handleSend}
              className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-2 focus-within:border-green-400"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about products..."
                maxLength={2000}
                disabled={loading}
                className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-gray-800 outline-none placeholder:text-gray-400 disabled:opacity-60"
              />

              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-700 text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Send message"
              >
                {loading ? (
                  <LoaderCircle size={19} className="animate-spin" />
                ) : (
                  <Send size={19} />
                )}
              </button>
            </form>

            <p className="mt-3 text-center text-[11px] text-gray-400">
              LocalHub AI currently uses catalog-based product search. Responses
              may be limited.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AIAssistantPage;
