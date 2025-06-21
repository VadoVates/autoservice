from datetime import datetime, timezone
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import uvicorn
from typing import Optional
from api.routes.customers import router as customers_router
from api.routes.dashboard import router as dashboard_router
from api.routes.vehicles import router as vehicles_router
from api.routes.orders import router as orders_router
from api.routes.queue import router as queue_router

from models.base import get_db
from models import Customer, Vehicle, Order

app = FastAPI(
    title="AutoService Manager API",
    version="2.0.0"
)

# Konfiguracja CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://192.168.0.107:3000", "http://192.168.0.*:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(customers_router)
app.include_router(dashboard_router)
app.include_router(vehicles_router)
app.include_router(orders_router)
app.include_router(queue_router)

@app.get("/")
def read_root():
    return {
        "message": "Witaj w AutoService Manager API",
        "version": "2.0.0",
        "endpoints": {
            # Dashboard
            "dashboard": {
                "stats": "/api/dashboard/stats"
            },
            
            # Klienci
            "customers": {
                "list": "/api/customers",
                "get": "/api/customers/{customer_id}",
                "create": "POST /api/customers",
                "update": "PUT /api/customers/{customer_id}",
                "delete": "DELETE /api/customers/{customer_id}",
                "vehicles": "/api/customers/{customer_id}/vehicles"
            },
            
            # Pojazdy
            "vehicles": {
                "list": "/api/vehicles",
                "create": "POST /api/vehicles",
                "update": "PUT /api/vehicles/{vehicle_id}",
                "delete": "DELETE /api/vehicles/{vehicle_id}"
            },
            
            # Zlecenia
            "orders": {
                "list": "/api/orders?status={status}",
                "create": "POST /api/orders",
                "update": "PUT /api/orders/{order_id}",
                "delete": "DELETE /api/orders/{order_id}"
            },
            
            # Kolejka
            "queue": "/api/queue",
            
            # Dokumentacja
            "documentation": "/docs",
            "openapi": "/openapi.json",
            
            # Status
            "health": "/health"
        }
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)