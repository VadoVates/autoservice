from dotenv import load_dotenv
import os
from sqlalchemy import create_engine

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
print(f"Database URL: {DATABASE_URL}")

try:
    engine = create_engine(DATABASE_URL)
    connection = engine.connect()
    print("✓ Połączenie z bazą danych działa!")
    connection.close()
except Exception as e:
    print(f"✗ Błąd połączenia: {e}")