
from rest_framework import serializers

from apps.ai_assistant.models import Conversation


class ChatRequestSerializer(serializers.Serializer):

    message = serializers.CharField(
        max_length=2000,
        trim_whitespace=True,
    )

    conversation_id = serializers.IntegerField(
        required=False,
        min_value=1,
    )

    def validate_message(self, value):
        if not value.strip():
            raise serializers.ValidationError(
                "Message cannot be empty."
            )
        return value

    def validate_conversation_id(self, value):
        request = self.context.get("request")

        if not Conversation.objects.filter(
            id=value,
            user=request.user,
        ).exists():
            raise serializers.ValidationError(
                "Conversation not found."
            )

        return value
