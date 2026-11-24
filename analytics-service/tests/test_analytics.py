import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from app.models.analytics import TaskItemInput
from app.services.metrics import AnalyticsService

client = TestClient(app)

HEADERS = {"X-Service-API-Key": settings.INTERNAL_API_KEY}

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "UP"

def test_readiness_check():
    response = client.get("/readiness")
    assert response.status_code == 200
    assert response.json()["status"] == "READY"

def test_unauthorized_access():
    response = client.post("/api/v1/analytics/project/proj-123/health", json=[])
    assert response.status_code == 401

def test_project_health_calculation():
    now = datetime.utcnow()
    tasks = [
        TaskItemInput(
            id="t1",
            title="Task 1",
            status="DONE",
            priority="HIGH",
            estimated_hours=5.0,
            actual_hours=4.0,
            created_at=now - timedelta(days=2),
            completed_at=now,
        ),
        TaskItemInput(
            id="t2",
            title="Task 2",
            status="TODO",
            priority="MEDIUM",
            estimated_hours=3.0,
            actual_hours=0.0,
            due_date=now - timedelta(days=1), # Overdue
            created_at=now - timedelta(days=3),
        ),
    ]

    report = AnalyticsService.calculate_health("test-p1", tasks)
    assert report.total_tasks == 2
    assert report.completed_tasks == 1
    assert report.overdue_tasks == 1
    assert report.completion_rate == 50.0
    assert report.status_label in ["AT_RISK", "CRITICAL", "HEALTHY"]

def test_streaming_export_csv():
    payload = [
        {
            "id": "t1",
            "title": "Stream Task 1",
            "status": "DONE",
            "priority": "HIGH",
            "estimated_hours": 4.0,
            "actual_hours": 3.5,
            "created_at": datetime.utcnow().isoformat(),
        }
    ]
    response = client.post("/api/v1/analytics/export/stream?format=csv", json=payload, headers=HEADERS)
    assert response.status_code == 200
    assert "task_id,title,status" in response.text
    assert "Stream Task 1" in response.text
