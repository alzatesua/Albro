# panel_admin/throttling.py
from rest_framework.throttling import SimpleRateThrottle


class LoginPanelThrottle(SimpleRateThrottle):
    scope = 'panel_login'

    def get_cache_key(self, request, view):
        ident = self.get_ident(request)
        return self.cache_format % {'scope': self.scope, 'ident': ident}