from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime

class TaskItemInput(BaseModel):
    id: str
    title: str
    status: str
    priority: str
    estimated_hours: Optional[float] = 0.0
    actual_hours: Optional[float] = 0.0
    due_date: Optional[datetime] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    assignee_id: Optional[str] = "unassigned"

class ProjectHealthReport(BaseModel):
    project_id: str
    health_score: float = Field(..., ge=0.0, le=100.0, description="Health score from 0 to 100")
    total_tasks: int
    completed_tasks: int
    overdue_tasks: int
    completion_rate: float
    workload_efficiency: float
    status_label: str # HEALTHY, AT_RISK, CRITICAL

class CycleTimeMetric(BaseModel):
    average_cycle_time_hours: float
    min_cycle_time_hours: float
    max_cycle_time_hours: float
    total_completed_tasks: int

class WorkloadItem(BaseModel):
    assignee_id: str
    task_count: int
    total_estimated_hours: float
    total_actual_hours: float
