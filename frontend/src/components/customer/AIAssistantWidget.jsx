import { useEffect, useRef, useState } from "react";
import {
  Bot,
  MessageCircle,
  Send,
  X,
  Minus,
  Plus,
  LoaderCircle,
  UserRound,
  Sparkles,
  ShoppingCart,
  Check,
} from "lucide-react";

import {
  sendChatMessage,
  getConversations,
} from "../../services/aiAssistantService";

import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

function AIAssistantWidget() {
  const { isAuthenticated, user } = useAuth();
  const { addToCart } = useCart();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");
  const [addingProductId, setAddingProductId] = useState(null);
  const [cartNotices, setCartNotices] = useState({});

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }
  }, [messages, loading, isOpen, isMinimized]);

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const data = await getConversations();
      setConversations(data);
      setShowHistory(true);
    } catch (err) {
      console.error("Chat history error:", err);
      setError("Could not load chat history.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const openConversation = (conversation) => {
    setConversationId(conversation.id);

    setMessages(
      conversation.messages.map((message) => ({
        role: message.role,
        content: message.content,
        products: message.products || [],
      })),
    );

    setShowHistory(false);
    setError("");
  };

  const startNewChat = () => {
    setConversationId(null);
    setMessages([]);
    setInput("");
    setShowHistory(false);
    setError("");
    setCartNotices({});
    inputRef.current?.focus();
  };

  const handleSend = async (event) => {
    event.preventDefault();

    const message = input.trim();

    if (!message || loading) return;

    setMessages((previous) => [
      ...previous,
      { role: "USER", content: message },
    ]);

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
          products: response.products || [],
        },
      ]);
    } catch (err) {
      console.error("AI assistant error:", err);

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

  const handleAddToCart = async (product) => {
    if (addingProductId !== null) return;

    try {
      setAddingProductId(product.id);

      const added = await addToCart(product);

      if (added) {
        setCartNotices((previous) => ({
          ...previous,
          [product.id]: "Added to cart",
        }));
      } else {
        setCartNotices((previous) => ({
          ...previous,
          [product.id]: "Please login to add products",
        }));
      }
    } catch (err) {
      console.error("Add to cart error:", err);

      setCartNotices((previous) => ({
        ...previous,
        [product.id]:
          err.response?.data?.detail ||
          err.response?.data?.error ||
          "Could not add to cart",
      }));
    } finally {
      setAddingProductId(null);
    }
  };

  const suggestions = [
    "Show me rice products",
    "Find pharmacy products",
    "Show vegetables",
  ];

  if (!isAuthenticated || user?.role !== "CUSTOMER") {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-4 z-[100] flex flex-col items-end sm:bottom-6 sm:right-6">
      {isOpen && !isMinimized && (
        <div className="mb-4 flex h-[min(540px,calc(100dvh-110px))] w-[min(380px,calc(100vw-24px))] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex shrink-0 items-center gap-3 bg-[#174D35] px-4 py-4 text-white">
            <div className="rounded-full bg-white/15 p-2">
              <Bot size={23} />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="font-bold">LocalHub Assistant</h3>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-green-100">
                <span className="h-2 w-2 rounded-full bg-green-400" />
                Shopping Assistant
              </p>
            </div>

            <button
              onClick={loadHistory}
              disabled={historyLoading}
              title="Chat history"
              className="rounded-lg p-2 transition hover:bg-white/15 disabled:opacity-50"
            >
              <MessageCircle size={18} />
            </button>

            <button
              onClick={startNewChat}
              title="New chat"
              className="rounded-lg p-2 transition hover:bg-white/15"
            >
              <Plus size={19} />
            </button>

            <button
              onClick={() => setIsMinimized(true)}
              title="Minimize"
              className="rounded-lg p-2 transition hover:bg-white/15"
            >
              <Minus size={19} />
            </button>

            <button
              onClick={() => setIsOpen(false)}
              title="Close"
              className="rounded-lg p-2 transition hover:bg-white/15"
            >
              <X size={19} />
            </button>
          </div>

          {/* Conversation History */}
          {showHistory ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h4 className="font-bold text-gray-800">
                  Previous Conversations
                </h4>

                <button
                  onClick={() => setShowHistory(false)}
                  className="text-sm font-medium text-green-700"
                >
                  Back to chat
                </button>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto p-3">
                {historyLoading ? (
                  <div className="flex justify-center py-8">
                    <LoaderCircle className="animate-spin text-green-700" />
                  </div>
                ) : conversations.length === 0 ? (
                  <p className="py-8 text-center text-sm text-gray-400">
                    No conversations yet.
                  </p>
                ) : (
                  conversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      onClick={() => openConversation(conversation)}
                      className="w-full rounded-xl border border-gray-100 p-3 text-left transition hover:border-green-300 hover:bg-green-50"
                    >
                      <p className="truncate text-sm font-semibold text-gray-800">
                        {conversation.title || "New conversation"}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        {conversation.messages.length} messages
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 space-y-4 overflow-y-auto bg-[#F7FAF7] p-4">
                {messages.length === 0 ? (
                  <div className="flex min-h-full flex-col items-center justify-center text-center">
                    <div className="mb-4 rounded-2xl bg-green-100 p-4 text-green-700">
                      <Sparkles size={32} />
                    </div>

                    <h4 className="text-lg font-bold text-gray-900">
                      Hello! Welcome to LocalHub
                    </h4>

                    <p className="mt-2 max-w-[260px] text-sm leading-6 text-gray-500">
                      What are you looking for today? I can help you discover
                      products.
                    </p>

                    <div className="mt-5 flex w-full flex-col gap-2">
                      {suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => setInput(suggestion)}
                          className="rounded-xl border border-green-200 bg-white px-3 py-2.5 text-left text-xs font-medium text-green-800 transition hover:bg-green-50"
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
                      className={`flex items-end gap-2 ${
                        message.role === "USER"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      {message.role === "ASSISTANT" && (
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                          <Bot size={16} />
                        </div>
                      )}

                      <div className="flex max-w-[88%] flex-col gap-2">
                        <div
                          className={`whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13px] leading-6 ${
                            message.role === "USER"
                              ? "rounded-br-sm bg-[#DCF8C6] text-gray-800"
                              : "rounded-bl-sm bg-white text-gray-700 shadow-sm"
                          }`}
                        >
                          {message.content}
                        </div>

                        {/* Product Cards */}
                        {message.role === "ASSISTANT" &&
                          message.products?.map((product) => (
                            <div
                              key={product.id}
                              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                            >
                              <div className="flex gap-3 p-3">
                                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                                  {product.image ? (
                                    <img
                                      src={product.image}
                                      alt={product.name}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-full items-center justify-center text-gray-400">
                                      <ShoppingCart size={25} />
                                    </div>
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <h4 className="line-clamp-2 text-sm font-semibold text-gray-800">
                                    {product.name}
                                  </h4>

                                  <p className="mt-1 text-base font-bold text-green-700">
                                    ৳{product.price}
                                  </p>

                                  <p className="mt-1 text-xs text-gray-500">
                                    Available: {product.available_quantity}
                                  </p>
                                </div>
                              </div>

                              <div className="border-t border-gray-100 p-2.5">
                                <button
                                  onClick={() => handleAddToCart(product)}
                                  disabled={
                                    addingProductId !== null ||
                                    product.available_quantity <= 0
                                  }
                                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {addingProductId === product.id ? (
                                    <>
                                      <LoaderCircle
                                        size={15}
                                        className="animate-spin"
                                      />
                                      Adding...
                                    </>
                                  ) : cartNotices[product.id] ===
                                    "Added to cart" ? (
                                    <>
                                      <Check size={15} />
                                      Added to Cart
                                    </>
                                  ) : (
                                    <>
                                      <ShoppingCart size={15} />
                                      Add to Cart
                                    </>
                                  )}
                                </button>

                                {cartNotices[product.id] &&
                                  cartNotices[product.id] !==
                                    "Added to cart" && (
                                    <p className="mt-1 text-center text-[11px] text-red-600">
                                      {cartNotices[product.id]}
                                    </p>
                                  )}
                              </div>
                            </div>
                          ))}
                      </div>

                      {message.role === "USER" && (
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-600">
                          <UserRound size={15} />
                        </div>
                      )}
                    </div>
                  ))
                )}

                {loading && (
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-green-700">
                      <Bot size={16} />
                    </div>

                    <div className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2.5 text-xs text-gray-500 shadow-sm">
                      <LoaderCircle size={15} className="animate-spin" />
                      Searching products...
                    </div>
                  </div>
                )}

                {error && (
                  <div className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">
                    {error}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form
                onSubmit={handleSend}
                className="flex shrink-0 items-center gap-2 border-t border-gray-100 bg-white p-3"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Type a message..."
                  maxLength={2000}
                  disabled={loading}
                  className="min-w-0 flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-green-500 disabled:opacity-60"
                />

                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  aria-label="Send message"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-700 text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading ? (
                    <LoaderCircle size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </form>

              <div className="shrink-0 bg-white pb-2 text-center text-[10px] text-gray-400">
                Powered by LocalHub
              </div>
            </>
          )}
        </div>
      )}

      {/* Minimized State */}
      {isOpen && isMinimized && (
        <button
          onClick={() => setIsMinimized(false)}
          className="mb-3 flex items-center gap-2 rounded-full bg-[#174D35] px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-green-800"
        >
          <Bot size={19} />
          LocalHub Assistant
          <Plus size={17} />
        </button>
      )}

      {/* Floating Launcher */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          aria-label="Open LocalHub AI Assistant"
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-green-700 text-white shadow-xl transition duration-300 hover:scale-105 hover:bg-green-800"
        >
          <MessageCircle size={27} />

          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-green-400" />

          <span className="pointer-events-none absolute bottom-full right-0 mb-3 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100">
            Chat with LocalHub AI
          </span>
        </button>
      )}
    </div>
  );
}

export default AIAssistantWidget;
