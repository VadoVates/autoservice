from datetime import date, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from api.utils import ACTIVE_STATUSES, count_active_orders
from models.base import get_db
from models.customer import Customer
from models.order import Order
from models.vehicle import Vehicle

RECENT_ORDERS = 6

router = APIRouter(
    prefix="/api/dashboard",
    tags=["dashboard"]
)

def get_priority_stats(db: Session) -> dict:
    stats = {
        "normal" : 0,
        "high" : 0,
        "urgent" : 0
    }

    orders_by_priority = db.query(
        Order.priority,
        func.count(Order.id).label('count')
    ).filter(
        Order.status.in_(ACTIVE_STATUSES)
    ).group_by(Order.priority).all()

    for priority, count in orders_by_priority:
        stats[priority] = count

    return stats

def get_recent_orders(db: Session) -> dict:
    recent_orders = db.query(Order).order_by(Order.created_at.desc()).limit(RECENT_ORDERS).all()
    recent_orders_data = []
    for order in recent_orders:
        recent_orders_data.append({
            "id": order.id,
            "customer_name": order.customer.name if order.customer else "Nieznany",
            "vehicle": f"{order.vehicle.brand} {order.vehicle.model}" if order.vehicle else "Nieznany",
            "status": order.status,
            "priority": order.priority,
            "created_at": order.created_at
        })
    return recent_orders_data

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    today = date.today()
    tomorrow = today + timedelta(days=1)

    first_day_of_the_month = today.replace(day=1)
    month_now = first_day_of_the_month.month
    year_now = first_day_of_the_month.year

    first_day_of_the_next_month = (
        first_day_of_the_month.replace(month=month_now + 1
        ) if month_now < 12 else
        first_day_of_the_month.replace(month = 1, year = year_now+1)
    )

    total_customers = db.query(Customer).count()
    total_vehicles = db.query(Vehicle).count()
    total_orders = db.query(Order).count()

    active_orders = count_active_orders(db)

    orders_in_queue = db.query(Order).filter(
        Order.status == "new",
        Order.work_station_id == None
        ).count()
    
    completed_today = db.query(Order).filter(
        Order.status == "completed",
        Order.completed_at >= today,
        Order.completed_at < tomorrow
    ).count()

    station_1_busy = db.query(Order).filter(
        Order.work_station_id == 1,
        Order.status.in_(["in_progress", "waiting_for_parts"])
    ).count() > 0

    station_2_busy = db.query(Order).filter(
        Order.work_station_id == 2,
        Order.status.in_(["in_progress", "waiting_for_parts"])
    ).count() > 0

    revenue_today = db.query(func.sum(Order.final_cost)).filter(
        Order.status == "invoiced",
        Order.completed_at >= today,
        Order.completed_at < tomorrow
    ).scalar() or 0
    
    revenue_month = db.query(func.sum(Order.final_cost)).filter(
        Order.status == "invoiced",
    Order.completed_at >= first_day_of_the_month,
    Order.completed_at < first_day_of_the_next_month
    ).scalar() or 0

    return {
        "total_customers": total_customers,
        "total_vehicles": total_vehicles,
        "total_orders": total_orders,
        "active_orders": active_orders,
        "orders_in_queue": orders_in_queue,
        "completed_today": completed_today,
        "priority_stats": get_priority_stats(db),
        "station_1_busy": station_1_busy,
        "station_2_busy": station_2_busy,
        "revenue_today": revenue_today,
        "revenue_month": revenue_month,
        "recent_orders": get_recent_orders(db)
    }


