import os

from dotenv import load_dotenv

load_dotenv()

_SSL_CERT = os.getenv("DB_SSL_CERT_PATH")

DB_CONFIG: dict = {
    "host":     os.environ["DB_HOST"],
    "port":     int(os.getenv("DB_PORT", "5432")),
    "user":     os.environ["DB_USER"],
    "password": os.environ["DB_PASSWORD"],
    "database": os.environ["DB_NAME"],
    "options":  "-c lc_messages=C",
    "sslmode":  "verify-full" if _SSL_CERT else "require",
    **({"sslrootcert": _SSL_CERT} if _SSL_CERT else {}),
}
