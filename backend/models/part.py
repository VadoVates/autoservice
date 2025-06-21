from __future__ import annotations

from sqlalchemy import String, Float, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

class Part(Base):
    __tablename__ = "parts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    stock_quantity: Mapped[int] = mapped_column(Integer, default=0)

    order_parts: Mapped[list["OrderPart"]] = relationship(back_populates="part") # type: ignore
