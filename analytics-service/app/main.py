from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.endpoints import router as analytics_router

app = FastAPI(
    title="WorkSphere Analytics & Processing Microservice",
    description="Dedicated microservice for project health metrics, cycle time analysis, and high-throughput streaming exports.",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health & Readiness probes (Assessment 06 & 09)
@app.get("/health", status_code=status.HTTP_200_OK, tags=["observability"])
def health_check():
    return {
        "status": "UP",
        "service": settings.SERVICE_NAME,
        "environment": settings.ENV,
    }

@app.get("/readiness", status_code=status.HTTP_200_OK, tags=["observability"])
def readiness_probe():
    return {
        "status": "READY",
        "service": settings.SERVICE_NAME,
    }

app.include_router(analytics_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
