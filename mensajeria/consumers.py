import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone

from .models import Conversacion, Mensaje
from .notifications import notificar_mensaje


class ChatConsumer(AsyncWebsocketConsumer):
    """
    Consumer de chat 1 a 1 entre cliente y profesional.
    ws://host/ws/chat/<conversacion_id>/?ticket=<ticket>
    """

    async def connect(self):
        user = self.scope.get("user")
        self.conversacion_id = self.scope["url_route"]["kwargs"]["conversacion_id"]

        if user is None or not user.is_authenticated:
            await self.close(code=4001)  # no autorizado
            return

        conversacion = await self.get_conversacion(self.conversacion_id)
        if conversacion is None:
            await self.close(code=4004)  # no existe
            return

        if not await self.es_participante(conversacion, user):
            await self.close(code=4003)  # prohibido
            return

        self.group_name = f"chat_{self.conversacion_id}"
        self.user = user
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        try:
            data = json.loads(text_data)
        except (TypeError, ValueError):
            return

        contenido = (data.get("contenido") or "").strip()
        if not contenido:
            return

        mensaje = await self.guardar_mensaje(self.conversacion_id, self.user.id, contenido)

        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "chat_mensaje",
                "mensaje": {
                    "id": mensaje.id,
                    "conversacion": self.conversacion_id,
                    "remitente": self.user.id,
                    "contenido": mensaje.contenido,
                    "fecha_envio": mensaje.fecha_envio.isoformat(),
                    "leido": mensaje.leido,
                },
            },
        )

    async def chat_mensaje(self, event):
        await self.send(text_data=json.dumps({
            "evento": "mensaje",
            "mensaje": event["mensaje"],
        }))

    @database_sync_to_async
    def get_conversacion(self, conversacion_id):
        return Conversacion.objects.filter(id=conversacion_id).first()

    @database_sync_to_async
    def es_participante(self, conversacion, user):
        return conversacion.es_participante(user)

    @database_sync_to_async
    def guardar_mensaje(self, conversacion_id, remitente_id, contenido):
        Conversacion.objects.filter(id=conversacion_id).update(ultima_actividad=timezone.now())
        mensaje = Mensaje.objects.create(
            conversacion_id=conversacion_id,
            remitente_id=remitente_id,
            contenido=contenido,
        )
        notificar_mensaje(mensaje)
        return mensaje