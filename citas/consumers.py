import json
from channels.generic.websocket import AsyncWebsocketConsumer


class CitaConsumer(AsyncWebsocketConsumer):
    """
    Consumer WebSocket para notificaciones de citas en tiempo real.
    Cada usuario autenticado se une a un grupo personal `user_<id>`,
    así solo recibe eventos de las citas donde es cliente o profesional.
    """

    async def connect(self):
        user = self.scope.get("user")

        if user is None or not user.is_authenticated:
            await self.close(code=4001)  # no autorizado
            return

        self.group_name = f"user_{user.id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        # Este consumer es solo de notificaciones (servidor -> cliente).
        # No procesamos mensajes entrantes del cliente por ahora.
        pass

    # Handler que invoca notifications.py vía channel_layer.group_send
    # El "type" del evento ("cita_actualizada") debe coincidir con el
    # nombre de este método.
    async def cita_actualizada(self, event):
        await self.send(text_data=json.dumps({
            "tipo": event["tipo"],       # "creada" | "actualizada" | "cancelada"
            "cita": event["cita"],
        }))