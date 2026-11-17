
import api from "./api";

// Send a chat message
export const sendChatMessage = async (message, conversationId = null) => {
  const payload = {
    message,
  };

  if (conversationId) {
    payload.conversation_id = conversationId;
  }

  const response = await api.post("/ai/chat/", payload);
  return response.data;
};

// Get customer's conversation history
export const getConversations = async () => {
  const response = await api.get("/ai/conversations/");
  return response.data;
};
