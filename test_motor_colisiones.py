"""
Suite de pruebas: Motor Anti-Colisiones Horarias — UPEL Mesa Manager
Ejecutar desde la raíz del proyecto:  python test_motor_colisiones.py

Arquitectura del motor:
  Las colisiones (aula, jurado, estudiante activo) son detectadas en Python
  por _verificar_choques_7vias() y _deducir_tipo_mesa() en
  features/mesas/repository.py, que lanzan ValueError con mensajes exactos.
  No son constraints de BD, por eso se captura ValueError (y psycopg2.Error
  como fallback para errores de conexión/integridad puros).
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Forzar UTF-8 en stdout/stderr para que los caracteres de caja no rompan
# en consolas Windows con codepage CP1252.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import psycopg2

from core.database import get_connection
from features.mesas.repository import crear_mesa

# ─── Utilidades de salida ─────────────────────────────────────────────────────

_PASS = "✅"
_FAIL = "❌"
_resultados: list[bool] = []


def _encabezado(texto: str) -> None:
    relleno = "─" * max(0, 55 - len(texto))
    print(f"\n─── {texto} {relleno}")


def run_test(nombre: str, esperado_exito: bool, fn) -> None:
    """Ejecuta fn(), compara con lo esperado e imprime el resultado."""
    try:
        fn()
        exito   = True
        detalle = "Operación permitida."
    except ValueError as exc:
        exito   = False
        detalle = str(exc)
    except psycopg2.Error as exc:
        exito   = False
        detalle = f"[psycopg2] {exc}"

    ok = exito == esperado_exito
    _resultados.append(ok)

    print(f"  {_PASS if ok else _FAIL}  {nombre}")
    if not ok:
        esperado_str = "éxito"  if esperado_exito else "rechazo"
        real_str     = "éxito"  if exito          else "rechazo"
        print(f"       Esperado: {esperado_str}  |  Obtenido: {real_str}")
    if not exito:
        print(f"       » {detalle}")


# ─── Setup de BD ─────────────────────────────────────────────────────────────

def _limpiar(cur) -> None:
    # Orden explícito para que RESTART IDENTITY afecte a todas las tablas.
    # CASCADE propaga el truncado hacia las tablas dependientes.
    cur.execute(
        "TRUNCATE TABLE mesas_defensa, estudiantes, profesores, aulas "
        "RESTART IDENTITY CASCADE"
    )


def _insertar_semillas(cur) -> tuple:
    """
    Inserta el mínimo de datos para los 4 escenarios y retorna:
      (est1_id, est2_id, aula_a_id, aula_b_id)

    Diseño del comité:
      Estudiante 1 → P1, P2, P3, P4, P5, P6
      Estudiante 2 → P1, P7, P8, P9, P10, P11   ← P1 compartido

    P1 compartido permite:
      · Escenario 2: detectar colisión de aula (check de aula dispara primero)
      · Escenario 3: detectar colisión de jurado en aula diferente
    """

    # Maestría — reutilizar el seed 'IE' o insertar una de test
    cur.execute("SELECT id FROM maestrias WHERE codigo_interno = 'IE'")
    fila = cur.fetchone()
    if fila:
        maestria_id = fila[0]
    else:
        cur.execute(
            "INSERT INTO maestrias (nombre, codigo_interno) "
            "VALUES ('Innovación Educativa', 'IE') RETURNING id"
        )
        maestria_id = cur.fetchone()[0]

    # ── 11 profesores ─────────────────────────────────────────────────────────
    profesores = [
        # cedula        apellido       nombre      especialidad
        ("10000001", "García",    "Roberto",  "Metodología"),    # P1  ← pivote
        ("10000002", "López",     "María",    "Tecnología"),      # P2
        ("10000003", "Martínez",  "Carlos",   "Gestión"),         # P3
        ("10000004", "Rodríguez", "Ana",      "Pedagogía"),       # P4
        ("10000005", "Hernández", "Luis",     "Investigación"),   # P5
        ("10000006", "González",  "Patricia", "Currículo"),       # P6
        ("10000007", "Pérez",     "José",     "Tecnología"),      # P7
        ("10000008", "Sánchez",   "Carmen",   "Metodología"),     # P8
        ("10000009", "Ramírez",   "Diego",    "Gestión"),         # P9
        ("10000010", "Torres",    "Lucía",    "Pedagogía"),       # P10
        ("10000011", "Flores",    "Marcos",   "Investigación"),   # P11
    ]
    ids_prof = []
    for cedula, apellido, nombre, especialidad in profesores:
        cur.execute(
            "INSERT INTO profesores "
            "  (cedula, nombre, apellido, especialidad, correo_electronico) "
            "VALUES (%s, %s, %s, %s, %s) RETURNING id",
            (cedula, nombre, apellido, especialidad, f"{cedula}@test.upel.edu"),
        )
        ids_prof.append(cur.fetchone()[0])

    p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11 = ids_prof

    # ── 2 aulas ───────────────────────────────────────────────────────────────
    cur.execute(
        "INSERT INTO aulas (nombre_aula, ubicacion) "
        "VALUES ('Sala Test A', 'Postgrado') RETURNING id"
    )
    aula_a = cur.fetchone()[0]

    cur.execute(
        "INSERT INTO aulas (nombre_aula, ubicacion) "
        "VALUES ('Sala Test B', 'Postgrado') RETURNING id"
    )
    aula_b = cur.fetchone()[0]

    # ── Estudiante 1 — comité P1..P6 ─────────────────────────────────────────
    # verificado_m1=TRUE requerido por el candado de solvencia
    cur.execute(
        """
        INSERT INTO estudiantes (
            cedula, nombre, apellido, maestria_id, cohorte,
            titulo_proyecto, correo_electronico,
            id_tutor_principal,   id_tutor_suplente,
            id_jurado1_principal, id_jurado1_suplente,
            id_jurado2_principal, id_jurado2_suplente,
            verificado_m1
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, TRUE)
        RETURNING id
        """,
        (
            "V200001", "Pedro", "Álvarez", maestria_id, "2024-I",
            "Impacto de la inteligencia artificial en la educación venezolana",
            "pedro.alvarez@test.upel.edu",
            p1, p2, p3, p4, p5, p6,
        ),
    )
    est1_id = cur.fetchone()[0]

    # ── Estudiante 2 — comité P1,P7..P11 (P1 compartido) ─────────────────────
    cur.execute(
        """
        INSERT INTO estudiantes (
            cedula, nombre, apellido, maestria_id, cohorte,
            titulo_proyecto, correo_electronico,
            id_tutor_principal,   id_tutor_suplente,
            id_jurado1_principal, id_jurado1_suplente,
            id_jurado2_principal, id_jurado2_suplente,
            verificado_m1
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, TRUE)
        RETURNING id
        """,
        (
            "V200002", "Luisa", "Mendoza", maestria_id, "2024-I",
            "Metodologías activas en la educación básica venezolana",
            "luisa.mendoza@test.upel.edu",
            p1, p7, p8, p9, p10, p11,  # P1 compartido → colisión de jurado
        ),
    )
    est2_id = cur.fetchone()[0]

    return est1_id, est2_id, aula_a, aula_b


# ─── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    print()
    print("═" * 62)
    print("  UPEL Mesa Manager — Suite: Motor Anti-Colisiones (7 vías)")
    print("═" * 62)

    # Setup — usa get_connection() de core.database (misma config que la app)
    try:
        with get_connection() as (_, cur):
            _limpiar(cur)
            est1_id, est2_id, aula_a, aula_b = _insertar_semillas(cur)
    except Exception as exc:
        print(f"\n{_FAIL}  Error en el setup: {exc}")
        sys.exit(1)

    print("\n  Semillas listas:")
    print(f"    Estudiante 1 → id={est1_id}  comité: P1–P6")
    print(f"    Estudiante 2 → id={est2_id}  comité: P1, P7–P11  (P1 compartido)")
    print(f"    Sala A → id={aula_a}   |   Sala B → id={aula_b}")

    FECHA = "2026-09-01"

    # ── Escenario 1 ───────────────────────────────────────────────────────────
    _encabezado("Escenario 1 — Inserción válida (debe permitirse)")
    print("  Est.1 | Sala A | 08:00 | sin conflictos")
    run_test(
        "Programar Mesa 1 de Estudiante 1",
        esperado_exito=True,
        fn=lambda: crear_mesa(est1_id, aula_a, FECHA, "08:00"),
    )

    # ── Escenario 2 ───────────────────────────────────────────────────────────
    _encabezado("Escenario 2 — Colisión de Aula (debe bloquearse)")
    print("  Est.2 | Sala A | 08:00  ← misma sala y horario que la Mesa 1")
    run_test(
        "Registrar en Sala A ya ocupada",
        esperado_exito=False,
        fn=lambda: crear_mesa(est2_id, aula_a, FECHA, "08:00"),
    )

    # ── Escenario 3 ───────────────────────────────────────────────────────────
    _encabezado("Escenario 3 — Colisión de Jurado (debe bloquearse)")
    print("  Est.2 | Sala B | 08:00  ← sala libre, pero García/Roberto")
    print("  es Tutor Principal en AMBOS comités y ya está en Mesa 1")
    run_test(
        "Registrar con jurado García (P1) ya ocupado en otra sala",
        esperado_exito=False,
        fn=lambda: crear_mesa(est2_id, aula_b, FECHA, "08:00"),
    )

    # ── Escenario 4 ───────────────────────────────────────────────────────────
    _encabezado("Escenario 4 — Colisión de Estudiante (debe bloquearse)")
    print("  Est.1 | Sala B | 10:00  ← hora y sala libres, pero el")
    print("  estudiante ya tiene una mesa en estado Programada activa")
    run_test(
        "Segunda mesa para Estudiante 1 (ya tiene una activa)",
        esperado_exito=False,
        fn=lambda: crear_mesa(est1_id, aula_b, FECHA, "10:00"),
    )

    # ── Resumen ───────────────────────────────────────────────────────────────
    pasados = sum(_resultados)
    total   = len(_resultados)
    print()
    print("═" * 62)
    if pasados == total:
        print(f"  {_PASS}  {pasados}/{total} pruebas pasadas — motor funcionando correctamente")
    else:
        fallidos = total - pasados
        print(
            f"  {_FAIL}  {pasados}/{total} pasadas  "
            f"({fallidos} fallida{'s' if fallidos > 1 else ''})"
        )
    print("═" * 62)
    print()

    sys.exit(0 if pasados == total else 1)


if __name__ == "__main__":
    main()
