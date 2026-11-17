from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from apps.ai_assistant.serializers.chat import ChatRequestSerializer
from apps.ai_assistant.services.chat_service import process_chat_message

from apps.ai_assistant.models import Conversation
from apps.ai_assistant.serializers.history import ConversationHistorySerializer

class AIChatAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        if request.user.role != "CUSTOMER":
            return Response(
                {"error": "Only customers can use the AI assistant."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ChatRequestSerializer(
            data=request.data,
            context={"request": request},
        )

        serializer.is_valid(raise_exception=True)

        result = process_chat_message(
            user=request.user,
            message=serializer.validated_data["message"],
            conversation_id=serializer.validated_data.get("conversation_id"),
            request=request,
        )

        return Response(result, status=status.HTTP_200_OK)


class AIConversationHistoryAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        if request.user.role != "CUSTOMER":
            return Response(
                {"error": "Only customers can access chat history."},
                status=status.HTTP_403_FORBIDDEN,
            )

        conversations = Conversation.objects.filter(user=request.user).prefetch_related(
            "messages"
        )

        serializer = ConversationHistorySerializer(
            conversations,
            many=True,
        )

        return Response(serializer.data, status=status.HTTP_200_OK)
