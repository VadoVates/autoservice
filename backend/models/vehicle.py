from __future__ import annotations

from sqlalchemy import String, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional
from .base import Base

class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"))
    brand: Mapped[str] = mapped_column(String(50), nullable=False)
    model: Mapped[str] = mapped_column(String(50), nullable=False)
    year: Mapped[Optional[int]] = mapped_column(nullable=True)
    registration_number: Mapped[Optional[str]] = mapped_column(String(20), unique=True, nullable=True)
    vin: Mapped[Optional[str]] = mapped_column(String(17), unique=True, nullable=True)

    owner: Mapped["Customer"] = relationship(back_populates="vehicles") # type: ignore
    orders: Mapped[list["Order"]] = relationship(back_populates="vehicle") # type: ignore
