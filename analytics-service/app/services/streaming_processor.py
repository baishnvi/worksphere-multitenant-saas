import io
import csv
import json
from typing import Generator, List, Dict, Any
from datetime import datetime
from app.models.analytics import TaskItemInput

class StreamingProcessor:
    """
    Assessment 05: Reusable Python Package to process large task-activity exports,
    calculate productivity metrics, and produce streaming CSV/JSON reports
    WITHOUT loading the entire dataset into memory.
    """

    @staticmethod
    def stream_csv_export(tasks_generator: Generator[TaskItemInput, None, None]) -> Generator[str, None, None]:
        output = io.StringIO()
        writer = csv.writer(output)

        # Write CSV header
        header = [
            "task_id",
            "title",
            "status",
            "priority",
            "assignee_id",
            "estimated_hours",
            "actual_hours",
            "is_overdue",
            "created_at",
            "due_date",
        ]
        writer.writerow(header)
        yield output.getvalue()
        output.seek(0)
        output.truncate(0)

        now = datetime.utcnow()

        # Stream row by row in memory-efficient chunks
        for task in tasks_generator:
            is_overdue = False
            if task.due_date and task.status != "DONE":
                is_overdue = task.due_date.replace(tzinfo=None) < now

            row = [
                task.id,
                task.title,
                task.status,
                task.priority,
                task.assignee_id or "unassigned",
                task.estimated_hours or 0.0,
                task.actual_hours or 0.0,
                "YES" if is_overdue else "NO",
                task.created_at.isoformat(),
                task.due_date.isoformat() if task.due_date else "",
            ]
            writer.writerow(row)
            yield output.getvalue()
            output.seek(0)
            output.truncate(0)

    @staticmethod
    def stream_ndjson_export(tasks_generator: Generator[TaskItemInput, None, None]) -> Generator[str, None, None]:
        """Streams newline-delimited JSON for high-throughput pipelines"""
        now = datetime.utcnow()
        for task in tasks_generator:
            is_overdue = False
            if task.due_date and task.status != "DONE":
                is_overdue = task.due_date.replace(tzinfo=None) < now

            record = {
                "task_id": task.id,
                "title": task.title,
                "status": task.status,
                "priority": task.priority,
                "assignee_id": task.assignee_id,
                "estimated_hours": task.estimated_hours,
                "actual_hours": task.actual_hours,
                "is_overdue": is_overdue,
                "created_at": task.created_at.isoformat(),
                "due_date": task.due_date.isoformat() if task.due_date else None,
            }
            yield json.dumps(record) + "\n"
