import re

from django.db import transaction
from django.utils import timezone

from apps.ai_assistant.models import Conversation, Message
from apps.ai_assistant.services.product_search import search_products

STOP_WORDS = {
    "show",
    "me",
    "find",
    "search",
    "for",
    "the",
    "a",
    "an",
    "some",
    "all",
    "list",
    "display",
    "product",
    "products",
    "please",
    "i",
    "want",
    "need",
    "to",
    "buy",
    "get",
    "give",
    "do",
    "you",
    "have",
    "is",
    "there",
    "any",
    "available",
    "in",
    "localhub",
    "can",
    "could",
    "would",
    "sow",
    "shwo",
    "shwoe",
    "plz",
    "pls",
}


def extract_search_keyword(message):
    words = re.findall(r"[a-zA-Z0-9]+", message.lower())
    keywords = [word for word in words if word not in STOP_WORDS]
    return " ".join(keywords)


@transaction.atomic
def process_chat_message(user, message, conversation_id=None, request=None):

    if conversation_id:
        conversation = Conversation.objects.get(
            id=conversation_id,
            user=user,
        )
    else:
        conversation = Conversation.objects.create(
            user=user,
            title=message[:200],
        )

    Message.objects.create(
        conversation=conversation,
        role=Message.Role.USER,
        content=message,
    )

    search_query = extract_search_keyword(message)

    products = search_products(query=search_query, limit=5) if search_query else []

    # Convert relative image paths into absolute URLs.
    if request:
        for product in products:
            if product["image"]:
                product["image"] = request.build_absolute_uri(product["image"])

    if products:
        product_lines = []

        for product in products:
            product_lines.append(
                f"- {product['name']}: ৳{product['price']} "
                f"(Available: {product['available_quantity']})"
            )

        reply = (
            "I found these products in LocalHub:\n"
            + "\n".join(product_lines)
            + "\n\nYou can add these products to your cart below."
        )

    else:
        reply = (
            "I couldn't find matching products in LocalHub. "
            "Try searching with a different product name or category."
        )

    assistant_message = Message.objects.create(
        conversation=conversation,
        role=Message.Role.ASSISTANT,
        content=reply,
        products=products,
    )

    conversation.updated_at = timezone.now()
    conversation.save(update_fields=["updated_at"])

    return {
        "conversation_id": conversation.id,
        "message": assistant_message.content,
        "products": assistant_message.products,
        "created_at": assistant_message.created_at,
    }
