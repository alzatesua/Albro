class AccesoBloqueadoError(Exception):
    """Se lanza cuando un usuario no puede iniciar sesión por trial vencido o falta de pago."""
    def __init__(self, mensaje):
        self.mensaje = mensaje
        super().__init__(mensaje)


def validar_acceso_usuario(usuario):
    """
    Valida si un usuario puede iniciar sesión según su periodo de prueba
    y estado de membresía. Solo aplica a usuarios con rol 'profesional'.
    Lanza AccesoBloqueadoError si no puede.
    Se usa tanto en login normal como en login con Google.
    """
    # Esta validación completa solo aplica al rol profesional
    if usuario.rol != 'profesional':
        return

    # 1. Validación de periodo de prueba (trial)
    if usuario.esta_en_trial and usuario.trial_expirado:
        raise AccesoBloqueadoError(
            f'Tu periodo de prueba gratuita de {usuario.dias_prueba} días ha finalizado.'
        )

    # 2. Validación de membresía / pago (solo si ya no está en trial)
    if not usuario.esta_en_trial:
        membresia = getattr(usuario, 'membresia', None)
        if membresia is None or not membresia.pagado:
            raise AccesoBloqueadoError(
                'Aún no has realizado el pago de tu membresía.'
            )