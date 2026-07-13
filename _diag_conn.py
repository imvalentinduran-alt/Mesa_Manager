import psycopg2
import traceback

BASE = {"host": "localhost", "port": 5432, "user": "postgres",
        "password": "proyecto", "database": "base_de_datos_proyecto"}

print("--- traceback completo ---")
try:
    conn = psycopg2.connect(**BASE)
    print(f"OK  enc={conn.encoding}")
    conn.close()
except Exception:
    traceback.print_exc()

# Intentar con DSN string en lugar de kwargs
print("\n--- via DSN string ---")
try:
    conn = psycopg2.connect(
        "host=localhost port=5432 user=postgres password=proyecto dbname=base_de_datos_proyecto"
    )
    print(f"OK  enc={conn.encoding}")
    conn.close()
except Exception:
    traceback.print_exc()
