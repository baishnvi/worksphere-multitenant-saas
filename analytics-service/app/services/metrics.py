from typing import List, Dict
from datetime import datetime
from app.models.analytics import (
    TaskItemInput,
    ProjectHealthReport,
    CycleTimeMetric,
    WorkloadItem,
)

class AnalyticsService:
    @staticmethod
    def calculate_health(project_id: str, tasks: List[TaskItemInput]) -> ProjectHealthReport:
        if not tasks:
            return ProjectHealthReport(
                project_id=project_id,
                health_score=100.0,
                total_tasks=0,
                completed_tasks=0,
                overdue_tasks=0,
                completion_rate=100.0,
                workload_efficiency=100.0,
                status_label="HEALTHY",
            )

        total = len(tasks)
        completed = sum(1 for t in tasks if t.status == "DONE")
        now = datetime.utcnow()

        overdue = 0
        total_est = 0.0
        total_act = 0.0

        for t in tasks:
            if t.due_date and t.status != "DONE":
                if t.due_date.replace(tzinfo=None) < now:
                    overdue += 1
            if t.estimated_hours:
                total_est += t.estimated_hours
            if t.actual_hours:
                total_act += t.actual_hours

        completion_rate = round((completed / total) * 100, 2)
        overdue_penalty = (overdue / total) * 40.0 # up to 40 point penalty

        # Efficiency: ratio of estimated vs actual hours
        efficiency = 100.0
        if total_act > 0 and total_est > 0:
            ratio = total_est / total_act
            efficiency = min(round(ratio * 100, 2), 150.0)

        health_score = max(0.0, min(100.0, round(completion_rate - overdue_penalty, 2)))

        if health_score >= 70.0:
            status_label = "HEALTHY"
        elif health_score >= 40.0:
            status_label = "AT_RISK"
        else:
            status_label = "CRITICAL"

        return ProjectHealthReport(
            project_id=project_id,
            health_score=health_score,
            total_tasks=total,
            completed_tasks=completed,
            overdue_tasks=overdue,
            completion_rate=completion_rate,
            workload_efficiency=efficiency,
            status_label=status_label,
        )

    @staticmethod
    def calculate_cycle_time(tasks: List[TaskItemInput]) -> CycleTimeMetric:
        cycle_times = []
        for t in tasks:
            if t.status == "DONE" and t.completed_at and t.created_at:
                delta = t.completed_at - t.created_at
                hours = max(0.1, delta.total_seconds() / 3600.0)
                cycle_times.append(hours)

        if not cycle_times:
            return CycleTimeMetric(
                average_cycle_time_hours=0.0,
                min_cycle_time_hours=0.0,
                max_cycle_time_hours=0.0,
                total_completed_tasks=0,
            )

        return CycleTimeMetric(
            average_cycle_time_hours=round(sum(cycle_times) / len(cycle_times), 2),
            min_cycle_time_hours=round(min(cycle_times), 2),
            max_cycle_time_hours=round(max(cycle_times), 2),
            total_completed_tasks=len(cycle_times),
        )

    @staticmethod
    def calculate_workload(tasks: List[TaskItemInput]) -> List[WorkloadItem]:
        distribution: Dict[str, Dict[str, float]] = {}

        for t in tasks:
            assignee = t.assignee_id or "unassigned"
            if assignee not in distribution:
                distribution[assignee] = {"count": 0, "estimated": 0.0, "actual": 0.0}
            distribution[assignee]["count"] += 1
            distribution[assignee]["estimated"] += t.estimated_hours or 0.0
            distribution[assignee]["actual"] += t.actual_hours or 0.0

        return [
            WorkloadItem(
                assignee_id=k,
                task_count=int(v["count"]),
                total_estimated_hours=round(v["estimated"], 2),
                total_actual_hours=round(v["actual"], 2),
            )
            for k, v in distribution.items()
        ]
