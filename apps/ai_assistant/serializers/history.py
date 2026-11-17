from rest_framework import serializers

from apps.ai_assistant.models import Conversation, Message


class MessageHistorySerializer(serializers.ModelSerializer):

    class Meta:
        model = Message
        fields = [
            "id",
            "role",
            "content",
            "products",
            "created_at",
        ]


class ConversationHistorySerializer(serializers.ModelSerializer):

    messages = MessageHistorySerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = Conversation
        fields = [
            "id",
            "title",
            "messages",
            "created_at",
            "updated_at",
        ]
