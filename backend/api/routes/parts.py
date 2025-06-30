from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException
from typing import Optional

from api.models import PartCreate, PartUpdate
from api.utils import get_object_or_404, serialize_part
from models.part import Part
from models.base import get_db
from models.order_part import OrderPart

router = APIRouter(
    prefix="/api/parts",
    tags=["parts"]
)

@router.post("")
def create_part(part: PartCreate, db: Session = Depends(get_db)):
    existing = db.query(Part).filter(Part.code == part.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Part already exists")

    db_part = Part(**part.model_dump())
    db.add(db_part)
    db.commit()
    db.refresh(db_part)
    return db_part

@router.get("")
def get_parts(skip: int = 0, limit: int = 100, search: Optional[str] = None, in_stock_only: bool = False, db: Session = Depends(get_db)):
    query = db.query(Part)

    if search:
        query = query.filter(Part.name.ilike(f"%{search}%") | Part.code.ilike(f"%{search}%"))

    if in_stock_only:
        query = query.filter(Part.stock_quantity > 0)

    parts = query.offset(skip).limit(limit).all()
    return parts

@router.get("/{part_id}")
def get_part(part_id: int, db: Session = Depends(get_db)):
    return get_object_or_404(db, Part, part_id, "Part")

@router.put("/{part_id}")
def update_part(part_id: int, part_update: PartUpdate, db: Session = Depends(get_db)):
    part = get_object_or_404(db, Part, part_id, "Part")

    update_data = part_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(part, key, value)

    db.commit()
    db.refresh(part)
    return part

@router.delete("/{part_id}")
def delete_part(part_id: int, db: Session = Depends(get_db)):
    part = get_object_or_404(db, Part, part_id, "Part")

    used_in_orders = db.query(OrderPart).filter(OrderPart.part_id == part_id).count()
    if used_in_orders > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Can't delete part - it's used in {used_in_orders} orders"
        )

    db.delete(part)
    db.commit()
    return {"message": "Part deleted successfully"}

@router.put("/{part_id}/stock")
def update_stock(part_id: int, quantity_change:int, db: Session = Depends(get_db)):
    part = get_object_or_404(db, Part, part_id, "Part")
    new_stock_quantity = part.stock_quantity + quantity_change

    if new_stock_quantity < 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot reduce stock below 0. Current: {part.stock_quantity}, Change: {quantity_change}"
        )

    part.stock_quantity = new_stock_quantity
    db.commit()
    db.refresh(part)

    return serialize_part(part, quantity_change)