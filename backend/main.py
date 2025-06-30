from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from api.routes.customers import router as customers_router
from api.routes.dashboard import router as dashboard_router
from api.routes.vehicles import router as vehicles_router
from api.routes.orders import router as orders_router
from api.routes.queue import router as queue_router
from api.routes.parts import router as parts_router

app = FastAPI(
    title="AutoService Manager API",
    version="2.0.0"
)

"""
DEBUG
"""
"""

from fastapi.exceptions import RequestValidationError
from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print("Validation error:", exc.errors())
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )
    
"""

# Konfiguracja CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(customers_router)
app.include_router(dashboard_router)
app.include_router(vehicles_router)
app.include_router(orders_router)
app.include_router(queue_router)
app.include_router(parts_router)

@app.get("/")
def read_root():
    return {
        "message": "Witaj w AutoService Manager API",
        "version": "2.0.0",
        "endpoints": {
            "dashboard": {
                "stats": "/api/dashboard/stats"
            },
            "health": "/health"
        }
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)