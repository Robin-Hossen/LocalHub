from django.urls import path

from apps.ai_assistant.views import (
    AIChatAPIView,
    AIConversationHistoryAPIView,
)

urlpatterns = [
    path(
        "chat/",
        AIChatAPIView.as_view(),
        name="ai-chat",
    ),
    path(
        "conversations/",
        AIConversationHistoryAPIView.as_view(),
        name="ai-conversations",
    ),
]
