import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SERVICE_NAME: str = "worksphere-analytics-service"
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    INTERNAL_API_KEY: str = os.getenv("ANALYTICS_SERVICE_API_KEY", "ws_internal_service_key_998877")
    ENV: str = os.getenv("ENV", "development")

    class Config:
        env_file = ".env"

settings = Settings()
