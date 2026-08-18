# AlphaLens AI: Investment Research Platform

AlphaLens AI is an enterprise-grade, microservice-based investment research platform. It leverages AI to generate structured fundamental analysis reports, perform Retrieval-Augmented Generation (RAG) over financial filings (SEC 10-K, 10-Q), calculate portfolio risk factors, and cluster news events based on financial impact.

---

## 1. System Requirements

Before setting up the project, ensure you have the following installed on your computer:

1. **Docker Desktop**
   * Required to run database engines locally: PostgreSQL (relational DB), Redis (caching and queues), and Qdrant (vector engine).
   * [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. **Node.js (v18.0.0 or higher)**
   * Required for running the Express API gateway backend and Next.js frontend.
   * [Download Node.js](https://nodejs.org/)
3. **Python (v3.10 or higher)**
   * Required for the AI Microservice, vector processing, and LLM agent orchestration.
   * [Download Python](https://www.python.org/)
4. **Git**
   * For cloning libraries and version control.

---

## 2. Installation & Setup

Follow these steps to configure the development environment.

### Step 1: Run Backing Infrastructure (Docker)
In the root directory of the project, spin up the relational database, cache, and vector store containers:
```bash
docker compose up -d
```
Verify the containers are running:
```bash
docker ps
```
*Port mappings created:*
* **PostgreSQL**: `localhost:5432`
* **Redis**: `localhost:6379`
* **Qdrant**: `localhost:6333` (Dashboard: `http://localhost:6333/dashboard`)

---

### Step 2: Configure & Launch Backend Service (Express)
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` and set your credentials (JWT_SECRET, database connections).*
4. Run Prisma database migrations to create tables:
   ```bash
   npx prisma migrate dev --name init
   ```
5. Seed initial data (optional):
   ```bash
   npx prisma db seed
   ```
6. Start the backend development server:
   ```bash
   npm run dev
   ```
The backend server runs at `http://localhost:5000`. API Docs are located at `http://localhost:5000/api-docs`.

---

### Step 3: Configure & Launch AI Microservice (FastAPI)
1. Open a new terminal and navigate to the AI service directory:
   ```bash
   cd ai-service
   ```
2. Create and activate a Python virtual environment:
   * **Windows**:
     ```bash
     python -m venv venv
     .\venv\Scripts\activate
     ```
   * **macOS/Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the environment variables:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` and insert your OpenAI/Anthropic API keys.*
5. Launch the FastAPI server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
The AI service runs locally at `http://localhost:8000`. Access its Swagger UI documentation at `http://localhost:8000/docs`.

---

### Step 4: Launch Frontend Interface (Next.js)
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install UI dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
Open `http://localhost:3000` in your browser to view the application dashboard.

---

## 3. Directory Layout Overview

```text
AlphaLens-AI/
├── README.md               # Quickstart setup instructions
├── requirements.md         # Full specifications and checklists
├── architecture.md         # Architecture diagrams and schema details
├── docker-compose.yml      # Orchestrates Postgres, Redis, and Qdrant
├── backend/                # Express.js API Gateway (TypeScript)
├── ai-service/             # FastAPI NLP & Embeddings Engine (Python)
└── frontend/               # Next.js App Router (TypeScript + Tailwind)
```
