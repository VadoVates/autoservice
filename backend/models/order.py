from __future__ import annotations

from typing import Optional
from sqlalchemy import Integer, Text, DateTime, ForeignKey, Float, Enum as SQLEnum
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime, timezone
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

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"))
    vehicle_id: Mapped[int] = mapped_column(ForeignKey("vehicles.id"))
    work_station_id: Mapped[Optional[int]] = mapped_column(ForeignKey("work_stations.id"), nullable=True)
    
    description: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[Priority] = mapped_column(SQLEnum(Priority), default=Priority.NORMAL)
    status: Mapped[OrderStatus] = mapped_column(SQLEnum(OrderStatus), default=OrderStatus.NEW)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    estimated_cost: Mapped[float] = mapped_column(default=0.0)
    final_cost: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    customer: Mapped["Customer"] = relationship(back_populates="orders") # type: ignore
    vehicle: Mapped["Vehicle"] = relationship(back_populates="orders") # type: ignore
    work_station: Mapped[Optional["WorkStation"]] = relationship(back_populates="orders") # type: ignore
    parts_used: Mapped[list["OrderPart"]] = relationship(back_populates="order") # type: ignore
    invoice: Mapped[Optional["Invoice"]] = relationship(back_populates="order", uselist=False) # type: ignore
