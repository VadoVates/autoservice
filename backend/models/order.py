from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from .base import Base

class Priority(enum.Enum):
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"

class OrderStatus(enum.Enum):
    NEW = "new"
    IN_PROGRESS = "in_progress"
    WAITING_FOR_PARTS = "waiting_for_parts"
    COMPLETED = "completed"
    INVOICED = "invoiced"

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"))
    work_station_id = Column(Integer, ForeignKey("work_stations.id"), nullable=True)
    
    description = Column(Text, nullable=False)
    priority = Column(Enum(Priority), default=Priority.NORMAL)
    status = Column(Enum(OrderStatus), default=OrderStatus.NEW)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    estimated_cost = Column(Float, default=0.0)
    final_cost = Column(Float, nullable=True)
    
    customer = relationship("Customer", back_populates="orders")
    vehicle = relationship("Vehicle", back_populates="orders")
    work_station = relationship("WorkStation", back_populates="orders")
    parts_used = relationship("OrderPart", back_populates="order")
    invoice = relationship("Invoice", back_populates="order", uselist=False)