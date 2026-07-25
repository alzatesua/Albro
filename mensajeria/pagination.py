from rest_framework.pagination import CursorPagination


class MensajesPagination(CursorPagination):
    """
    Pagina mensajes del más reciente al más antiguo (page_size por defecto: 20).
    Usamos cursor en vez de número de página porque en un chat llegan
    mensajes nuevos constantemente; con paginación por número de página
    eso desalinea las páginas siguientes y puede duplicar u omitir mensajes.
    """
    page_size = 20
    max_page_size = 50
    page_size_query_param = "page_size"
    ordering = "-fecha_envio"
    cursor_query_param = "cursor"