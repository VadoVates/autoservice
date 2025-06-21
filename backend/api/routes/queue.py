from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from models.base import get_db
from models.order import Order

router = APIRouter(
    prefix="/api/queue",
    tags=["queue"]
)

@router.get("")
def get_queue(db: Session = Depends(get_db)):
    station_1_orders = db.query(Order).filter(
        Order.work_station_id == 1,
        Order.status.in_(["in_progress", "waiting_for_parts"])
    ).all()

    station_2_orders = db.query(Order).filter(
        Order.work_station_id == 2,
        Order.status.in_(["in_progress", "waiting_for_parts"])
    ).all()

    waiting_orders = db.query(Order).filter(
        Order.work_station_id == None,
        Order.status == "new"
    ).order_by(
        Order.priority.desc(),
        Order.created_at
    ).all()

    waiting_for_parts_orders = db.query(Order).filter(
        Order.status == "waiting_for_parts",
        Order.work_station_id == None
    ).order_by(
        Order.priority.desc(),
        Order.created_at
    ).all()

    completed_orders = db.query(Order).filter(
        Order.status.in_(["completed"])
    ).all()
    
    return {
        "station_1": station_1_orders,
        "station_2": station_2_orders,
        "waiting": waiting_orders,
        "waiting_for_parts": waiting_for_parts_orders,
        "completed": completed_orders
    }