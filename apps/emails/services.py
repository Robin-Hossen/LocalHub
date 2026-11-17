from django.conf import settings
from django.core.mail import send_mail

from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives


def send_email(subject, message, recipient_list):
    return send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=recipient_list,
        fail_silently=False,
    )


def send_templated_email(
    subject,
    template_name,
    context,
    recipient_list,
    text_message="",
):
    context['subject'] = subject

    html_message = render_to_string(
        template_name,
        context
    )

    email = EmailMultiAlternatives(
        subject=subject,
        body=text_message or "Please view this email in an HTML-compatible email client.",
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=recipient_list,
    )

    email.attach_alternative(html_message, "text/html")

    return email.send(fail_silently=False)


def send_order_confirmation_email(order):
    customer_name = (
        order.customer.get_full_name()
        or order.customer.email
    )

    return send_templated_email(
        subject=f"Your LocalHub Order {order.order_number} is Confirmed!",
        template_name="emails/order_confirmation.html",
        context={
            "customer_name": customer_name,
            "order_number": order.order_number,
            "order_status": order.status,
            "payment_method": order.payment_method,
            "total_amount": order.total_amount,
        },
        recipient_list=[order.customer.email],
        text_message=(
            f"Your order {order.order_number} has been confirmed. "
            f"Total amount: {order.total_amount}"
        ),
    )


def send_order_processing_email(order):
    customer_name = order.customer.get_full_name() or order.customer.email

    return send_templated_email(
        subject=f"Your LocalHub Order {order.order_number} Is Being Processed!",
        template_name="emails/order_processing.html",
        context={
            "customer_name": customer_name,
            "order_number": order.order_number,
            "order_status": order.status,
            "payment_method": order.payment_method,
            "total_amount": order.total_amount,
        },
        recipient_list=[order.customer.email],
        text_message=(
            f"Your order {order.order_number} is now being processed. "
            f"Total amount: {order.total_amount}"
        ),
    )


def send_order_shipped_email(order):
    customer_name = order.customer.get_full_name() or order.customer.email

    return send_templated_email(
        subject=f"Your LocalHub Order {order.order_number} Has Been Shipped!",
        template_name="emails/order_shipped.html",
        context={
            "customer_name": customer_name,
            "order_number": order.order_number,
            "order_status": order.status,
            "payment_method": order.payment_method,
            "total_amount": order.total_amount,
        },
        recipient_list=[order.customer.email],
        text_message=(
            f"Your order {order.order_number} has been shipped. "
            f"Total amount: {order.total_amount}"
        ),
    )


def send_delivery_assignment_email(delivery):
    delivery_staff = delivery.delivery_staff
    order = delivery.order

    if not delivery_staff.email:
        return 0

    delivery_staff_name = delivery_staff.get_full_name() or delivery_staff.email

    items = order.items.all()

    return send_templated_email(
        subject=f"New Delivery Assigned - Order {order.order_number}",
        template_name="emails/delivery_assignment.html",
        context={
            "delivery_staff_name": delivery_staff_name,
            "order": order,
            "items": items,
            "delivery": delivery,
            "dashboard_url": (
                f"{settings.FRONTEND_URL.rstrip('/')}/delivery/my-deliveries"
            ),
        },
        recipient_list=[delivery_staff.email],
        text_message=(
            f"Hello {delivery_staff_name}, "
            f"Order {order.order_number} has been assigned to you. "
            f"Customer: {order.recipient_name}. "
            f"Phone: {order.recipient_phone}. "
            f"Address: {order.delivery_address_line}"
        ),
    )
