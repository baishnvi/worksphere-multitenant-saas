# WorkSphere – Multi-Tenant Project Management & Workflow Automation Platform

[![CI/CD Quality Pipeline](https://github.com/username/worksphere/actions/workflows/ci.yml/badge.svg)](https://github.com/username/worksphere/actions)
![Docker](https://img.shields.io/badge/Docker-Multi--Container-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)
![Next.js](https://img.shields.io/badge/Next.js-14_App_Router-black)
![Python](https://img.shields.io/badge/Python-FastAPI_3.11-green)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL_Prisma-336791)

> **Tayana Solutions Technical Assessment | WorkSphere Project-1**  
> Complete full-stack production platform meeting all 16 mandatory assessments and the domain-specific Capstone Challenge.

---

## 🌟 Key Architecture & Capabilities
1. **Multi-Tenant Data Isolation:** Shared Database, Shared Schema with Tenant Discriminator (`organizationId`). Strictly enforced at the middleware & repository boundary.
2. **Optimistic Concurrency Control (OCC) - Capstone Challenge:** Integer `version` on `Task` models prevents silent overwrites during concurrent edits with HTTP `409 Conflict` mitigation.
3. **Role-Based Access Control (RBAC):** Role hierarchy (`PLATFORM_ADMIN`, `OWNER`, `ADMIN`, `PROJECT_MANAGER`, `MEMBER`, `AUDITOR`). Dedicated read-only compliance access for Auditors.
4. **Python FastAPI Analytics Microservice:** High-throughput streaming CSV/JSON export without buffering datasets into memory, project health scoring, and cycle-time calculation.
5. **Real-time Engine & WebSockets:** Real-time task board updates and status transitions via Socket.io.
6. **Containerization & Observability:** Production-ready multi-stage Docker builds, Kubernetes-style `/health` and `/readiness` probes.

---

## 🛠️ Tech Stack
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide Icons, Axios.
- **Core Backend:** Node.js, Express.js, TypeScript, Prisma ORM, JWT (access + refresh rotation), Socket.io.
- **Analytics Microservice:** Python 3, FastAPI, Pydantic v2, Pytest.
- **Database & Cache:** PostgreSQL 16, Redis 7.
- **DevOps:** Docker, Docker Compose, GitHub Actions CI.

---

## 🚀 Quick Start Guide (Local Setup)

### 1. Prerequisites
- Docker & Docker Compose (or Node.js 20+ and Python 3.11+)

### 2. Run with Docker Compose (1-Command Full Stack)
```bash
cd devops
docker-compose up --build
```
This boots up:
- **Frontend App:** `http://localhost:3000`
- **Express Backend:** `http://localhost:5000` (`http://localhost:5000/health`)
- **FastAPI Analytics:** `http://localhost:8000` (`http://localhost:8000/docs`)
- **PostgreSQL:** `localhost:5432`
- **Redis:** `localhost:6379`

---

## 🔑 Pre-Seeded Assessor Demo Credentials
All accounts are configured with password: `Password@123`

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Org Owner** | `owner@tayana.com` | `Password@123` | Full admin privileges, invites, billing |
| **Project Manager**| `pm@tayana.com` | `Password@123` | Create projects, milestones, assign tasks |
| **Team Member** | `dev@tayana.com` | `Password@123` | Execute tasks, comments, status transitions |
| **Compliance Auditor** | `auditor@tayana.com` | `Password@123` | **Strictly Read-Only** forensic audit trail view |
| **Platform Admin** | `admin@worksphere.io`| `Password@123` | Superuser global tenant bypass |

---

## 🧪 Automated Testing

### Run Backend Unit & Concurrency Tests:
```bash
cd backend
npm test
```

### Run Python FastAPI Analytics Tests:
```bash
cd analytics-service
pytest tests/ -v
```

---

## 📁 Repository Structure
```
worksphere/
├── backend/            # Express.js TypeScript core API
├── analytics-service/  # Python FastAPI microservice & streaming engine
├── frontend/           # Next.js 14 App Router UI
├── devops/             # Multi-stage Dockerfiles & docker-compose.yml
├── .github/workflows/  # GitHub Actions CI quality pipeline
└── docs/               # Architecture diagrams, ER diagrams & submission reports
```
