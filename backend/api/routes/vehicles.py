from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from api.models import VehicleCreate
from api.utils import get_object_or_404, serialize_vehicle
from models.order import Order
from models.customer import Customer
from models.vehicle import Vehicle
from models.base import get_db

router = APIRouter(
    prefix="/api/vehicles",
    tags=["vehicles"]
)

@router.post("")
def create_vehicle(vehicle: VehicleCreate, db: Session = Depends(get_db)):
    existing = db.query(Vehicle).filter(Vehicle.registration_number == vehicle.registration_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Vehicle with this license plate already exists")
    
    db_vehicle = Vehicle(**vehicle.model_dump())
    db.add(db_vehicle)
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle

@router.get("")
def get_vehicles(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    vehicles = db.query(Vehicle).outerjoin(Customer).offset(skip).limit(limit).all()

    result = []
    for vehicle in vehicles:
        result.append(serialize_vehicle(vehicle, include_owner=True))

    return result

@router.put("/{vehicle_id}")
def update_vehicle(vehicle_id: int, vehicle_db: VehicleCreate, db: Session = Depends(get_db)):
    vehicle = get_object_or_404(db, Vehicle, vehicle_id, "Vehicle")

    for key, value in vehicle_db.model_dump().items():
        setattr(vehicle, key, value)

    db.commit()
    db.refresh(vehicle)
    return vehicle

@router.delete("/{vehicle_id}")
def delete_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle = get_object_or_404(db, Vehicle, vehicle_id, "Vehicle")

    orders_count = db.query(Order).filter(Order.vehicle_id == vehicle_id).count()
    if orders_count > 0:
        raise HTTPException(status_code=400, detail=f"Can't remove the vehicle, there's {orders_count} orders")
    
    db.delete(vehicle)
    db.commit()
    return {"message" : "Vehicle deleted succesfully"}