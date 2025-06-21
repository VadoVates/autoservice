from typing import Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session

from models.customer import Customer
from models.order import Order
from models.vehicle import Vehicle

ACTIVE_STATUSES = ["new", "in_progress", "waiting_for_parts"]

def get_object_or_404(db: Session, model, object_id: int, name: str = "Object"):
    obj = db.query(model).filter(model.id == object_id).first()
    if obj is None:
        raise HTTPException(status_code=404, detail=f"{name} not found")
    return obj

def serialize_customer(customer: Customer) -> dict:
    return {
        "id": customer.id,
        "name": customer.name,
        "phone": customer.phone,
        "email": customer.email
    }

def serialize_vehicle(vehicle: Vehicle, include_owner: bool = False) -> dict:
    data = {
            "id": vehicle.id,
            "brand": vehicle.brand,
            "model": vehicle.model,
            "registration_number": vehicle.registration_number,
            "year": vehicle.year,
            "vin": vehicle.vin,
            "customer_id": vehicle.customer_id,
    }

    if include_owner and vehicle.owner:
        data["owner"] = serialize_customer(vehicle.owner)

    return data

def serialize_order(order: Order) -> dict:
    return {
            "id": order.id,
            "customer_id": order.customer_id,
            "vehicle_id": order.vehicle_id,
            "work_station_id": order.work_station_id,
            "description": order.description,
            "priority": order.priority,
            "status": order.status,
            "created_at": order.created_at,
            "started_at": order.started_at,
            "completed_at": order.completed_at,
            "estimated_cost": order.estimated_cost,
            "final_cost": order.final_cost,
            "customer": serialize_customer(order.customer) if order.customer else None,
            "vehicle": serialize_vehicle(order.vehicle) if order.vehicle else None
    }

def count_active_orders(db : Session, customer_id: Optional[int] = None):
    if customer_id is None:
        result = db.query(Order).filter(
            Order.status.in_(ACTIVE_STATUSES)
        ).count()
    else:
        result = db.query(Order).filter(
            Order.customer_id == customer_id,
            Order.status.in_(ACTIVE_STATUSES)
        ).count()
    return result