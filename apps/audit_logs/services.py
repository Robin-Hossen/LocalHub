from apps.audit_logs.models import AuditLog


def create_audit_log(
    user,
    action,
    model_name,
    object_id=None,
    description='',
    old_values=None,
    new_values=None,
    ip_address=None,
):
    return AuditLog.objects.create(
        user=user if user and user.is_authenticated else None,
        action=action,
        model_name=model_name,
        object_id=str(object_id) if object_id is not None else None,
        description=description,
        old_values=old_values,
        new_values=new_values,
        ip_address=ip_address,
    )