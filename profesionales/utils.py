from datetime import datetime, timedelta

DIAS_SEMANA = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']


def generar_cupos_disponibles(perfil, servicio, fecha):
    from citas.models import Cita
    from servicios.models import ServicioProfesional

    relacion = ServicioProfesional.objects.filter(
        profesional=perfil, servicio=servicio, activo=True
    ).first()

    if not relacion:
        return []  # este profesional no ofrece ese servicio

    duracion = timedelta(minutes=relacion.duracion_minutos)

    dia_semana = DIAS_SEMANA[fecha.weekday()]
    franjas = [h for h in (perfil.horarios_atencion or []) if h.get('dia') == dia_semana]

    if not franjas:
        return []

    citas_ocupadas = list(
        Cita.objects.filter(
            profesional=perfil,
            fecha=fecha,
            estado__in=['pendiente', 'confirmada'],
        ).values_list('hora_inicio', 'hora_fin')
    )

    ahora = datetime.now()
    es_hoy = fecha == ahora.date()

    cupos = []
    for franja in franjas:
        try:
            inicio_franja = datetime.combine(fecha, datetime.strptime(franja['inicio'], '%H:%M').time())
            fin_franja = datetime.combine(fecha, datetime.strptime(franja['fin'], '%H:%M').time())
        except (KeyError, ValueError):
            continue

        cursor = inicio_franja
        while cursor + duracion <= fin_franja:
            slot_inicio = cursor.time()
            slot_fin = (cursor + duracion).time()

            ocupado = any(
                slot_inicio < h_fin and slot_fin > h_inicio
                for h_inicio, h_fin in citas_ocupadas
            )
            pasado = es_hoy and cursor <= ahora

            if not ocupado and not pasado:
                cupos.append(slot_inicio.strftime('%H:%M'))

            cursor += duracion

    return cupos