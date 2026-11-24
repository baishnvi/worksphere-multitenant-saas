# WorkSphere Multi-Tenant Database Architecture & ER Diagram

## 1. Overview
WorkSphere implements a **Shared Database, Shared Schema with Tenant Discriminator** pattern. Every query scoped to tenant data automatically enforces `organizationId = :currentOrgId` at the middleware/repository boundary.

## 2. Key Architectural Highlights
- **Optimistic Concurrency Control (OCC):** The `Task` entity includes an integer `version` field. When multiple project managers or team members update the same task simultaneously, updates verify that `version = current_version` and increment `version = version + 1`. If no rows are modified, a `409 CONFLICT` exception is thrown, preventing silent overwrites.
- **Tenant Isolation:** Enforced via `tenantContextMiddleware`. Every request extracts and verifies the user's role and membership in the target organization.
- **Audit Trails & Activity Logs:** Comprehensive tracking for regulatory and forensic auditor compliance (Assessment 02 & Capstone Challenge).
- **Idempotent Background Jobs & Notifications:** Unique `idempotencyKey` prevents duplicate notifications when workers retry failed jobs.

---

## 3. Entity-Relationship Diagram (Mermaid)

```mermaid
erDiagram
    ORGANIZATION ||--o{ ORGANIZATION_MEMBER : has
    ORGANIZATION ||--o{ TEAM : contains
    ORGANIZATION ||--o{ PROJECT : owns
    ORGANIZATION ||--o{ TASK : contains
    ORGANIZATION ||--o{ INVITATION : issues
    ORGANIZATION ||--o{ ACTIVITY_LOG : logs
    ORGANIZATION ||--o{ AUDIT_LOG : audits
    ORGANIZATION ||--o{ WORKFLOW_RULE : executes
    ORGANIZATION ||--o{ WEBHOOK_ENDPOINT : registers

    USER ||--o{ ORGANIZATION_MEMBER : joins
    USER ||--o{ REFRESH_TOKEN : authenticates
    USER ||--o{ PROJECT : owns
    USER ||--o{ TASK : creates_or_assigned
    USER ||--o{ COMMENT : posts
    USER ||--o{ ATTACHMENT : uploads
    USER ||--o{ NOTIFICATION : receives

    PROJECT ||--o{ MILESTONE : includes
    PROJECT ||--o{ TASK : tracks
    MILESTONE ||--o{ TASK : groups

    TASK ||--o{ SUBTASK : breaks_down_into
    TASK ||--o{ COMMENT : discusses
    TASK ||--o{ ATTACHMENT : attaches
    TASK ||--o{ ACTIVITY_LOG : logs_changes

    WEBHOOK_ENDPOINT ||--o{ WEBHOOK_DELIVERY : triggers

    ORGANIZATION {
        uuid id PK
        string name
        string slug UK
        enum plan
        timestamp createdAt
    }

    USER {
        uuid id PK
        string email UK
        string passwordHash
        string firstName
        string lastName
        boolean isPlatformAdmin
    }

    ORGANIZATION_MEMBER {
        uuid id PK
        uuid organizationId FK
        uuid userId FK
        enum role "OWNER, ADMIN, PROJECT_MANAGER, MEMBER, AUDITOR"
        boolean isSuspended
    }

    TASK {
        uuid id PK
        uuid organizationId FK
        uuid projectId FK
        string title
        enum status "BACKLOG, TODO, IN_PROGRESS, IN_REVIEW, DONE"
        enum priority "LOW, MEDIUM, HIGH, URGENT"
        int version "Optimistic Concurrency Control"
        float position "Kanban order"
        uuid assigneeId FK
        uuid reporterId FK
    }

    AUDIT_LOG {
        uuid id PK
        uuid organizationId FK
        uuid actorId FK
        string action
        string targetType
        string targetId
        json oldState
        json newState
        timestamp timestamp
    }
```
