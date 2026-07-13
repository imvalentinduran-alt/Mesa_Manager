import logging
import os
import smtplib
import threading
from email.mime.image import MIMEImage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from features.mesas import repository

logger = logging.getLogger(__name__)

_ICONS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "recursos", "icons")


# ─── Plantilla HTML ───────────────────────────────────────────────────────────

def _construir_html(datos: dict, rol: str, nombre: str) -> str:
    if rol == "Estudiante":
        rol_display  = "Defensor"
        rol_eyebrow  = "Tu participación en este acto"
        saludo_texto = (
            "Tu defensa de Trabajo de Grado fue programada exitosamente. "
            "A continuación encontrarás todos los detalles del acto."
        )
    else:
        rol_display  = rol
        rol_eyebrow  = "Tu rol en el Comité Evaluador"
        saludo_texto = (
            "Has sido designado/a como parte del Comité Evaluador para la defensa "
            "de Trabajo de Grado que se detalla a continuación."
        )

    tipo  = datos["tipo_mesa"]
    titulo = datos["titulo_proyecto"]
    year  = datos["fecha"].split("/")[-1] if "/" in datos["fecha"] else "2026"

    return f"""\
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Mesa de Defensa — UPEL</title>
</head>
<body style="margin:0;padding:0;background:#E2E8F0;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#E2E8F0;">
<tr><td align="center" style="padding:32px 16px;">

  <!-- ── Tarjeta 600px ── -->
  <table width="600" cellpadding="0" cellspacing="0"
         style="background:#ffffff;border-radius:16px;overflow:hidden;">

    <!-- ════════════════ HERO ════════════════ -->
    <tr>
      <td bgcolor="#00072d" style="padding:40px 48px 36px;text-align:center;">

        <!-- Logos -->
        <table cellpadding="0" cellspacing="0" align="center"
               style="margin-bottom:28px;">
          <tr>
            <td style="padding:0 24px;vertical-align:middle;text-align:center;">
              <img src="cid:logo_sip" alt="SIP" height="110"
                   style="display:block;height:110px;width:auto;max-width:120px;">
            </td>
            <td style="width:1px;background:#1E3A5F;height:40px;vertical-align:middle;">
              <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
                   width="1" height="40" alt="">
            </td>
            <td style="padding:0 24px;vertical-align:middle;text-align:center;">
              <img src="cid:logo_upel" alt="UPEL" height="90"
                   style="display:block;height:90px;width:auto;max-width:110px;">
            </td>
          </tr>
        </table>

        <!-- Eyebrow -->
        <p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;
                  font-size:10px;font-weight:bold;color:#4A7AB5;
                  text-transform:uppercase;letter-spacing:3px;">
          Postgrado UPEL &middot; Rubio
        </p>

        <!-- Título -->
        <p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;
                  font-size:28px;font-weight:bold;color:#ffffff;line-height:1.15;">
          Mesa de Defensa
          &nbsp;<span style="color:#4A7AB5;font-weight:normal;">#{datos['id_mesa']}</span>
        </p>

        <!-- Pill tipo -->
        <table cellpadding="0" cellspacing="0" align="center">
          <tr>
            <td style="background:#0f2a50;border:1px solid #2d5a8e;
                       border-radius:20px;padding:7px 20px;">
              <span style="font-family:Arial,Helvetica,sans-serif;
                           font-size:12px;color:#93C5FD;">
                &#9679;&nbsp; {tipo} &middot; {year}
              </span>
            </td>
          </tr>
        </table>

      </td>
    </tr>

    <!-- ════════════════ CUERPO ════════════════ -->
    <tr>
      <td bgcolor="#ffffff" style="padding:36px 48px 0;">

        <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;
                  font-size:15px;font-weight:bold;color:#1E3A5F;">
          Hola, {nombre}
        </p>
        <p style="margin:0 0 28px;font-family:Arial,Helvetica,sans-serif;
                  font-size:14px;color:#64748B;line-height:1.7;">
          {saludo_texto}
        </p>

        <!-- Tarjeta detalles -->
        <table width="100%" cellpadding="0" cellspacing="0"
               style="border:1px solid #BFDBFE;border-radius:12px;overflow:hidden;">

          <!-- Título proyecto -->
          <tr>
            <td bgcolor="#EFF6FF"
                style="padding:18px 22px;border-bottom:1px solid #BFDBFE;">
              <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;
                        font-size:10px;font-weight:bold;color:#2563EB;
                        text-transform:uppercase;letter-spacing:2px;">
                Título del Proyecto
              </p>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;
                        font-size:14px;font-weight:bold;color:#1E3A5F;
                        line-height:1.45;">
                {titulo}
              </p>
            </td>
          </tr>

          <!-- Filas de datos -->
          <tr>
            <td bgcolor="#EFF6FF" style="padding:6px 22px 10px;">
              <table width="100%" cellpadding="0" cellspacing="0">

                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #DBEAFE;
                             font-family:Arial,Helvetica,sans-serif;font-size:10px;
                             font-weight:bold;color:#93C5FD;text-transform:uppercase;
                             letter-spacing:1px;width:90px;vertical-align:middle;">
                    Estudiante
                  </td>
                  <td style="padding:10px 0;border-bottom:1px solid #DBEAFE;
                             font-family:Arial,Helvetica,sans-serif;font-size:13px;
                             font-weight:bold;color:#1E3A5F;vertical-align:middle;">
                    {datos['estudiante_nombre']}
                  </td>
                </tr>

                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #DBEAFE;
                             font-family:Arial,Helvetica,sans-serif;font-size:10px;
                             font-weight:bold;color:#93C5FD;text-transform:uppercase;
                             letter-spacing:1px;vertical-align:middle;">
                    Fecha
                  </td>
                  <td style="padding:10px 0;border-bottom:1px solid #DBEAFE;
                             font-family:Arial,Helvetica,sans-serif;font-size:13px;
                             font-weight:bold;color:#1E3A5F;vertical-align:middle;">
                    {datos['fecha']}
                  </td>
                </tr>

                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #DBEAFE;
                             font-family:Arial,Helvetica,sans-serif;font-size:10px;
                             font-weight:bold;color:#93C5FD;text-transform:uppercase;
                             letter-spacing:1px;vertical-align:middle;">
                    Horario
                  </td>
                  <td style="padding:10px 0;border-bottom:1px solid #DBEAFE;
                             font-family:Arial,Helvetica,sans-serif;font-size:13px;
                             font-weight:bold;color:#1E3A5F;vertical-align:middle;">
                    {datos['hora_inicio']} &mdash; {datos['hora_fin']}
                  </td>
                </tr>

                <tr>
                  <td style="padding:10px 0;
                             font-family:Arial,Helvetica,sans-serif;font-size:10px;
                             font-weight:bold;color:#93C5FD;text-transform:uppercase;
                             letter-spacing:1px;vertical-align:middle;">
                    Aula
                  </td>
                  <td style="padding:10px 0;
                             font-family:Arial,Helvetica,sans-serif;font-size:13px;
                             font-weight:bold;color:#1E3A5F;vertical-align:middle;">
                    {datos['nombre_aula']}
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>

      </td>
    </tr>

    <!-- ════════════════ ROL ════════════════ -->
    <tr>
      <td bgcolor="#ffffff" style="padding:24px 48px 32px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td bgcolor="#00072d"
                style="padding:20px 32px;text-align:center;border-radius:10px;">
              <p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;
                        font-size:10px;font-weight:bold;color:#4A7AB5;
                        text-transform:uppercase;letter-spacing:2px;">
                {rol_eyebrow}
              </p>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;
                        font-size:20px;font-weight:bold;color:#ffffff;">
                {rol_display}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- ════════════════ FOOTER ════════════════ -->
    <tr>
      <td bgcolor="#F8FAFF"
          style="padding:18px 48px;border-top:1px solid #E2E8F0;
                 border-radius:0 0 16px 16px;text-align:center;">
        <p style="margin:0;font-family:Arial,Helvetica,sans-serif;
                  font-size:11px;color:#94A3B8;line-height:1.7;">
          Este mensaje fue generado automáticamente por
          <strong style="color:#64748B;">UPEL Mesa Manager</strong>.<br>
          Por favor no respondas a este correo.
        </p>
      </td>
    </tr>

  </table>
</td></tr>
</table>

</body>
</html>"""


# ─── Preparación de destinatarios ────────────────────────────────────────────

def _preparar_destinatarios(datos: dict) -> list[tuple[str, str, str]]:
    """Retorna lista de (correo, rol, nombre) para los 7 miembros del acto."""
    return [
        (datos["estudiante_correo"],  "Estudiante",         datos["estudiante_nombre"]),
        (datos["tutor_p_correo"],     "Tutor Principal",    datos["tutor_p_nombre"]),
        (datos["tutor_s_correo"],     "Tutor Suplente",     datos["tutor_s_nombre"]),
        (datos["jurado1_p_correo"],   "Jurado 1 Principal", datos["jurado1_p_nombre"]),
        (datos["jurado1_s_correo"],   "Jurado 1 Suplente",  datos["jurado1_s_nombre"]),
        (datos["jurado2_p_correo"],   "Jurado 2 Principal", datos["jurado2_p_nombre"]),
        (datos["jurado2_s_correo"],   "Jurado 2 Suplente",  datos["jurado2_s_nombre"]),
    ]


def _cargar_imagen(nombre_archivo: str) -> bytes | None:
    ruta = os.path.normpath(os.path.join(_ICONS_DIR, nombre_archivo))
    try:
        with open(ruta, "rb") as f:
            return f.read()
    except OSError:
        logger.warning("No se encontró la imagen %s en %s", nombre_archivo, ruta)
        return None


# ─── Motor de envío ───────────────────────────────────────────────────────────

def _enviar_correos(id_mesa: int) -> None:
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port   = os.getenv("SMTP_PORT")
    smtp_user   = os.getenv("SMTP_USER")
    smtp_pass   = os.getenv("SMTP_PASSWORD")

    if not all([smtp_server, smtp_port, smtp_user, smtp_pass]):
        logger.warning(
            "Correos no enviados para mesa %s: faltan variables de entorno SMTP.", id_mesa
        )
        return

    try:
        datos = repository.obtener_datos_para_email(id_mesa)
    except Exception as exc:
        logger.error("Error al obtener datos de email para mesa %s: %s", id_mesa, exc)
        return

    if datos is None:
        logger.warning("No se encontraron datos de email para mesa %s.", id_mesa)
        return

    datos["id_mesa"] = id_mesa

    asunto = (
        f"Mesa {datos['tipo_mesa']} de Defensa de Trabajo de Grado"
        f" — {datos['estudiante_nombre']}"
    )

    img_sip  = _cargar_imagen("sipicon_white.png")
    img_upel = _cargar_imagen("logo_upel_white.png")

    try:
        with smtplib.SMTP(smtp_server, int(smtp_port)) as srv:
            srv.starttls()
            srv.login(smtp_user, smtp_pass)

            for correo, rol, nombre in _preparar_destinatarios(datos):
                if not correo:
                    continue

                html = _construir_html(datos, rol, nombre)

                # Estructura MIME: related > alternative + imágenes inline
                msg = MIMEMultipart("related")
                msg["From"]    = smtp_user
                msg["To"]      = correo
                msg["Subject"] = asunto

                alternative = MIMEMultipart("alternative")
                alternative.attach(MIMEText(html, "html", "utf-8"))
                msg.attach(alternative)

                if img_sip:
                    part = MIMEImage(img_sip, "png")
                    part.add_header("Content-ID", "<logo_sip>")
                    part.add_header("Content-Disposition", "inline",
                                    filename="sipicon_white.png")
                    msg.attach(part)

                if img_upel:
                    part = MIMEImage(img_upel, "png")
                    part.add_header("Content-ID", "<logo_upel>")
                    part.add_header("Content-Disposition", "inline",
                                    filename="logo_upel_white.png")
                    msg.attach(part)

                srv.send_message(msg)

    except Exception as exc:
        logger.error("Fallo en motor de correos para mesa %s: %s", id_mesa, exc)


# ─── Punto de entrada asíncrono ──────────────────────────────────────────────

def enviar_notificacion_async(id_mesa: int) -> None:
    threading.Thread(target=_enviar_correos, args=(id_mesa,), daemon=True).start()
