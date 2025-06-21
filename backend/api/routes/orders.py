from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends

from api.models import OrderCreate, OrderUpdate
from api.utils import get_object_or_404, serialize_order
from models.order import Order
from models.base import get_db


router = APIRouter(
    prefix="/api/orders",
    tags=["orders"]
)

@router.post("")
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    db_order = Order(**order.model_dump())
    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    db.refresh(db_order, ["customer", "vehicle"])

    return serialize_order(db_order)

@router.post("/{order_id}/invoice")
def create_invoice(order_id: int, db: Session = Depends(get_db)):
    return
    
@router.get("")
def get_orders(skip: int = 0, limit: int = 100, status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Order)

    if status:
        query = query.filter(Order.status == status)

    orders = query.order_by(
        Order.priority.desc(),
        Order.created_at.asc()
    ).offset(skip).limit(limit).all()
    
    # Dodaj dane klienta i pojazdu
    result = []
    for order in orders:
        result.append(serialize_order(order))
    
    return result

@router.put("/{order_id}")
def update_order(order_id: int, db_order: OrderUpdate, db: Session = Depends(get_db)):
    order = get_object_or_404(db, Order, order_id, "Order")

    update_data = db_order.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        if hasattr(order, key):
            setattr(order, key, value)

    if update_data.get("status") == "in_progress" and not order.started_at:
        order.started_at = datetime.now(timezone.utc)

    if update_data.get("status") == "completed" and not order.completed_at:
        order.completed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(order)
    return serialize_order(order)

@router.delete("/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = get_object_or_404(db, Order, order_id, "Order")
    
    db.delete(order)
    db.commit()
    return {"message": "Order deleted successfully"}