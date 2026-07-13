"""
Seed: asigna correos ficticios a estudiantes sin correo registrado.
Ejecutar desde la raíz del proyecto: python seed_emails.py
"""
import unicodedata
import psycopg2

DB_CONFIG = {
    "host":     "localhost",
    "port":     5432,
    "user":     "postgres",
    "password": "proyecto",
    "database": "base_de_datos_proyecto",
    "options":  "-c lc_messages=C",
}


def _normalizar(texto: str) -> str:
    nfkd = unicodedata.normalize("NFKD", texto)
    ascii_ = nfkd.encode("ASCII", "ignore").decode("ASCII")
    return "".join(c for c in ascii_.lower() if c.isalpha() or c.isdigit())


conn = psycopg2.connect(**DB_CONFIG)
cur  = conn.cursor()

cur.execute("SELECT id, nombre, apellido, cedula, correo_electronico FROM estudiantes ORDER BY id")
estudiantes = cur.fetchall()

emails_usados: set[str] = set()
actualizados  = 0

for est_id, nombre, apellido, cedula, correo in estudiantes:
    if correo and correo.strip():
        emails_usados.add(correo.lower())
        print(f"  [ya tiene] {apellido}, {nombre} -> {correo}")
        continue

    p_nombre   = _normalizar(nombre.split()[0])   if nombre   else ""
    p_apellido = _normalizar(apellido.split()[0])  if apellido else ""
    base = f"{p_apellido}.{p_nombre}" if p_apellido and p_nombre else f"est{cedula}"

    email = f"{base}@postgrado.upel.edu.ve"
    if email in emails_usados:
        email = f"{base}{cedula}@postgrado.upel.edu.ve"

    emails_usados.add(email)
    cur.execute("UPDATE estudiantes SET correo_electronico = %s WHERE id = %s", (email, est_id))
    print(f"  [asignado] {apellido}, {nombre} -> {email}")
    actualizados += 1

conn.commit()
cur.close()
conn.close()
print(f"\nOK: {actualizados} correo(s) asignado(s).")
