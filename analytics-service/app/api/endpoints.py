from fastapi import APIRouter, Depends, Query, Response
from fastapi.responses import StreamingResponse
from typing import List
from app.core.security import verify_service_api_key
from app.models.analytics import (
    TaskItemInput,
    ProjectHealthReport,
    CycleTimeMetric,
    WorkloadItem,
)
from app.services.metrics import AnalyticsService
from app.services.streaming_processor import StreamingProcessor

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])

@router.post("/project/{project_id}/health", response_model=ProjectHealthReport)
def get_project_health(
    project_id: str,
    tasks: List[TaskItemInput],
    _api_key: str = Depends(verify_service_api_key),
):
    """Calculates project health score, completion rate, and risk level"""
    return AnalyticsService.calculate_health(project_id, tasks)

@router.post("/project/{project_id}/cycle-time", response_model=CycleTimeMetric)
def get_cycle_time_analytics(
    project_id: str,
    tasks: List[TaskItemInput],
    _api_key: str = Depends(verify_service_api_key),
):
    """Calculates average, min, and max cycle time for completed tasks"""
    return AnalyticsService.calculate_cycle_time(tasks)

@router.post("/project/{project_id}/workload", response_model=List[WorkloadItem])
def get_workload_distribution(
    project_id: str,
    tasks: List[TaskItemInput],
    _api_key: str = Depends(verify_service_api_key),
):
    """Calculates workload distribution across team assignees"""
    return AnalyticsService.calculate_workload(tasks)

@router.post("/export/stream")
def stream_large_export(
    tasks: List[TaskItemInput],
    format: str = Query(default="csv", regex="^(csv|ndjson)$"),
    _api_key: str = Depends(verify_service_api_key),
):
    """
    Assessment 05: Chunked streaming export endpoint that streams data
    without loading large results entirely into memory.
    """
    def generator():
        for task in tasks:
            yield task

    if format == "csv":
        return StreamingResponse(
            StreamingProcessor.stream_csv_export(generator()),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=worksphere_tasks_report.csv"},
        )
    else:
        return StreamingResponse(
            StreamingProcessor.stream_ndjson_export(generator()),
            media_type="application/x-ndjson",
            headers={"Content-Disposition": "attachment; filename=worksphere_tasks_report.ndjson"},
        )
