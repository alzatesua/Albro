# panel_admin/permissions.py
from rest_framework.permissions import BasePermission


class EsOperadorPanel(BasePermission):
    def has_permission(self, request, view):
        return request.user is not None and hasattr(request.user, 'username') and \
               request.user.__class__.__name__ == 'AdminOperador'