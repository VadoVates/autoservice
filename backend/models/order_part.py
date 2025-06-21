from __future__ import annotations

from sqlalchemy import ForeignKey, Float, Integer
from sqlalchemy.orm import relationship, Mapped, mapped_column
from .base import Base

class OrderPart(Base):
    __tablename__ = "order_parts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"))
    part_id: Mapped[int] = mapped_column(ForeignKey("parts.id"))
    quantity: Mapped[int] = mapped_column(nullable=False)
    unit_price: Mapped[float] = mapped_column(Float, nullable=False)

    order: Mapped["Order"] = relationship(back_populates="parts_used") # type: ignore
    part: Mapped["Part"] = relationship(back_populates="order_parts") # type: ignore