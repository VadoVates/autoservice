from models.base import SessionLocal
from models.work_station import WorkStation

db = SessionLocal()

try:
    # Dodaj 2 stanowiska
    stations = [
        WorkStation(id=1, name="Stanowisko 1", is_active=True),
        WorkStation(id=2, name="Stanowisko 2", is_active=True),
    ]
    
    for station in stations:
        # Sprawdź czy już istnieje
        existing = db.query(WorkStation).filter(WorkStation.id == station.id).first()
        if not existing:
            db.add(station)
    
    db.commit()
    print("Dodano stanowiska warsztatowe")
    
except Exception as e:
    print(f"Błąd: {e}")
    db.rollback()
finally:
    db.close()