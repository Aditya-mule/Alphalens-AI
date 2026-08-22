# 🚀 AlphaLens AI — Enterprise-Grade AI Equity Intelligence Platform

**AlphaLens AI** is an enterprise-grade, microservice-based AI investment research & portfolio analysis platform for Indian Equities (NSE/BSE). It combines Retrieval-Augmented Generation (RAG) over corporate disclosures, side-by-side stock comparison scorecards, natural language screening across 2,500+ listed equities, and real-time portfolio risk auditing into a modern, light-theme Fintech user interface.

---

## 🌐 Live Production Deployments

| Component | Host Provider | Production Live URL / Endpoint | Status |
| :--- | :--- | :--- | :--- |
| **Frontend Dashboard** | **Vercel** | **[https://alphalens-ai-wine.vercel.app](https://alphalens-ai-wine.vercel.app)** | 🟢 **Live** |
| **API Gateway Backend** | **Google Cloud Run** | `https://alphalens-ai-service-446073417945.asia-south1.run.app` | 🟢 **Live** |
| **AI Microservice** | **Render** | `https://alphalens-ai-service.onrender.com` | 🟢 **Live** |
| **Relational Database** | **Neon PostgreSQL** | Managed Cloud DB (2,553 NSE Equities Seeded) | 🟢 **Active** |
| **Cache & BullMQ Queue** | **Upstash Redis** | Serverless TLS Redis Connection | 🟢 **Active** |
| **Vector Database** | **Qdrant Cloud** | 1GB Cloud Cluster (1536-dim OpenAI Embeddings) | 🟢 **Active** |

---

## ✨ Key Features & Capability Matrix

### 🎨 1. Light Fintech UI/UX Dashboard
* **Soft Neutral Canvas**: Built on a soft neutral slate (`#F8FAFC`) with crisp typography to avoid screen glare.
* **Glassmorphic Category Cards**: Rounded glass containers (`16–20px` radius) with subtle drop shadows and category-themed top accent borders:
  * 📘 PDF Ingest Processor: `Electric Indigo border-t-4`
  * 🟢 Smart Stock Screener: `Teal border-t-4`
  * 🟣 Portfolio Risk Auditor: `Purple border-t-4`
  * 🟠 VS Mode Stock Comparison: `Amber border-t-4`
* **Tabular Numeric Metrics**: Formatted monetary metrics, P/E ratios, and return metrics with monospace tabular numerals.

### 📚 2. RAG Filing & Disclosure Intelligence Engine
* **Vector Document Search**: Powered by Qdrant Vector Store using OpenAI `text-embedding-3-small` (1536 dimensions).
* **PDF Ingestion & Processing**: Extract page-by-page text from quarterly disclosures, annual reports, and SEC/BSE filings with 1000-character overlapping chunks.
* **Hybrid Knowledge Integration**: Combines indexed document snippets with verified live company financial metrics (revenue growth, ROCE, ROE, debt-to-equity, OPM, P/E) so the AI **never refuses** or gives boilerplate "cannot find in document" responses.
* **Citations**: Displays exact page and document ID citations for every synthesized answer.

### ⚔️ 3. Side-by-Side Stock VS Mode Comparison
* **Multi-Factor Scorecard**: Head-to-head evaluation across 5 critical investment vectors:
  1. Valuation (P/E & P/B Ratios)
  2. Growth (YoY Revenue Expansion)
  3. Profitability (Operating Margin - OPM)
  4. Capital Efficiency (ROCE & ROE)
  5. Solvency & Debt (Debt-to-Equity D/E Ratio)
* **LLM Synthesis**: Generates winner badges and structural comparative verdicts explaining why one stock outperforms another.

### 🔍 4. Natural Language Smart Stock Screener
* **Natural Language Queries**: Filter 2,500+ NSE listed equities using natural language prompts (e.g. *"Show me IT companies with ROCE > 20% and PE < 30"*).
* **Preset Screener Badges**: One-click screeners for **High Growth Tech**, **High ROCE Bargains**, **Low Debt Dividend Champions**, and **Undervalued Leaders**.

### 🛡️ 5. Portfolio Risk Auditor
* **Concentration Analysis**: Identifies over-exposure to single stocks (e.g. >25% portfolio weight) or single sectors.
* **Capital Efficiency Metrics**: Calculates weighted portfolio ROCE, aggregate dividend yield, and total unrealized P/L.
* **Automated Risk Alerts**: Soft amber pills and rose alert badges highlighting risk mitigation recommendations.

### 📰 6. Company-Tailored News & Sentiment Feed
* **Sector-Aware Intelligence**: Real-time news feed tailored specifically to the selected company's industry (Cloud/AI deals for IT stocks; Credit growth & NIMs for Banks; Green Energy & CAPEX for Industrials).
* **Sentiment Badging**: Bullish (+0.8), Bearish (-0.6), or Neutral badges computed via LLM NLP.

---

## 🛠️ Technology Stack Architecture

```text
               ┌─────────────────────────────────────────────────────────┐
               │              Next.js 14 Frontend (Vercel)               │
               │   TypeScript + Tailwind CSS + Lucide Icons + App Router  │
               └────────────────────────────┬────────────────────────────┘
                                            │ HTTP / JSON
                                            ▼
               ┌─────────────────────────────────────────────────────────┐
               │          Express.js API Gateway (GCP Cloud Run)         │
               │   TypeScript + Prisma ORM + BullMQ Jobs + JWT Auth      │
               └──────────────┬───────────────────────────┬──────────────┘
                              │                           │
                   ┌──────────┴───────────┐     ┌─────────┴───────────┐
                   ▼                      ▼     ▼                     ▼
          ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
          │ Neon PostgreSQL  │  │  Upstash Redis   │  │ Python FastAPI   │
          │ Relational Store │  │ Queue & Cache    │  │ AI Service       │
          └──────────────────┘  └──────────────────┘  │ (Render)         │
                                                      └─────────┬────────┘
                                                                │
                                                                ▼
                                                      ┌──────────────────┐
                                                      │  Qdrant Cloud    │
                                                      │  Vector Cluster  │
                                                      └──────────────────┘
```

| Layer | Technology Used | Description |
| :--- | :--- | :--- |
| **Frontend** | Next.js 14, React 18, Tailwind CSS, Lucide React | Client-side App Router UI deployed on Vercel |
| **API Gateway** | Node.js, Express, TypeScript, Prisma ORM, BullMQ | Microservice gateway with JWT auth deployed on GCP Cloud Run |
| **AI Microservice** | Python 3.13, FastAPI, Uvicorn, PyPDF | NLP & RAG processing engine deployed on Render |
| **Database** | Neon PostgreSQL | Serverless PostgreSQL storing Users, Watchlists, Portfolios, & Companies |
| **Cache & Queue** | Upstash Redis | Serverless Redis Broker for BullMQ cron sync and PDF ingestion jobs |
| **Vector DB** | Qdrant Cloud | Cloud vector database managing 1536-dim embeddings per company |
| **AI Models** | OpenAI GPT-4o-mini & `text-embedding-3-small` | LLM completion and text embedding generation |

---

## 📁 Repository Structure

```text
Stock_AI/
├── Dockerfile                  # Production Multi-Stage Dockerfile for Express Gateway
├── docker-compose.yml          # Local backing container orchestrator (Postgres, Redis, Qdrant)
├── README.md                   # Complete Project Overview & Setup Guide
├── architecture.md             # In-depth architectural specification
├── vercel.json                 # Vercel Monorepo build configuration
├── backend/                    # Express.js API Gateway (TypeScript)
│   ├── prisma/                 # Database schema & migrations
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── src/
│   │   ├── config/             # Logger & Prisma client
│   │   ├── middleware/         # Auth & Validation middlewares
│   │   ├── modules/            # Auth, Stocks, Screener, Portfolios, News, Chat
│   │   ├── queue/              # BullMQ Workers & Repeatable Sync Schedulers
│   │   ├── scripts/            # Full NSE 2,553 Companies Seeder (`seed_full_nse.ts`)
│   │   └── server.ts           # Server Entrypoint
├── ai-service/                 # Python FastAPI AI Microservice
│   ├── app/
│   │   ├── config.py           # Pydantic Settings
│   │   └── services/           # RAG, LLM, Qdrant, YFinance, Screener, Document Processor
│   ├── main.py                 # FastAPI App Entrypoint
│   ├── seed_qdrant_cloud.py    # Automated Qdrant Vector Seeder
│   └── requirements.txt        # Python Dependencies
└── frontend/                   # Next.js App Router Frontend
    ├── src/
    │   └── app/
    │       ├── page.tsx        # Main Light Fintech Dashboard Component
    │       └── layout.tsx
    ├── package.json
    └── tailwind.config.ts
```

---

## 💻 Local Development Setup Guide

### 1. Prerequisites
Ensure the following are installed locally:
- **Node.js**: `v18.0.0` or higher
- **Python**: `v3.10` or higher
- **Docker Desktop**: For running local Postgres, Redis, and Qdrant containers

---

### 2. Environment Configuration

#### A. Backend (`backend/.env`)
Create `backend/.env` with the following variables:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://user:password@your-neon-db-host.neon.tech/neondb?sslmode=require"
REDIS_URL="rediss://default:YOUR_UPSTASH_PASSWORD@your-upstash-redis-host.upstash.io:6379"
AI_SERVICE_URL="http://localhost:8001"
JWT_SECRET="your-jwt-secret-key"
JWT_REFRESH_SECRET="your-jwt-refresh-secret-key"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
```

#### B. AI Microservice (`ai-service/.env`)
Create `ai-service/.env` with:
```env
PORT=8001
ENVIRONMENT=development
OPENAI_API_KEY="sk-proj-YOUR_OPENAI_API_KEY"
QDRANT_URL="https://your-qdrant-cluster-url.qdrant.tech"
QDRANT_API_KEY="your-qdrant-api-key"
```

#### C. Frontend (`frontend/.env.local`)
Create `frontend/.env.local` with:
```env
NEXT_PUBLIC_API_URL="http://localhost:5000"
```

---

### 3. Step-by-Step Running Commands

#### Step 1: Start Docker Backing Services (Optional for Local DB)
```bash
docker compose up -d
```

#### Step 2: Set Up & Run Python AI Microservice
```bash
cd ai-service

# Create virtual environment
python -m venv .venv
# Activate on Windows:
.\.venv\Scripts\activate
# Activate on macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run Qdrant Vector Seeder
python seed_qdrant_cloud.py

# Start FastAPI server on port 8001
python -m uvicorn main:app --host 0.0.0.0 --port 8001
```

#### Step 3: Set Up & Run Express Backend Gateway
Open a new terminal:
```bash
cd backend

# Install dependencies
npm install

# Push database schema to PostgreSQL
npx prisma db push

# Seed 2,553 Listed NSE Companies
npx tsx src/scripts/seed_full_nse.ts

# Start Express gateway on port 5000
npm run dev
```

#### Step 4: Set Up & Run Next.js Frontend Dashboard
Open a new terminal:
```bash
cd frontend

# Install dependencies
npm install

# Start Next.js server on port 3000
npm run dev
```

Open **`http://localhost:3000`** in your browser!

---

## 🔒 Security & Code Standards

- **Strict Environment Isolation**: All sensitive credentials (`DATABASE_URL`, `REDIS_URL`, `OPENAI_API_KEY`, `JWT_SECRET`) are managed via environment variables and excluded via root & folder-level `.gitignore` files.
- **OpenSSL 3.0 Compatibility**: Prisma binary targets are explicitly set for `debian-openssl-3.0.x` and `linux-musl-openssl-3.0.x` for seamless container deployment on Google Cloud Run.
- **Rate Limiting & CORS Scoping**: Configured with `express-rate-limit` (5000 requests/window) and strict CORS origin validation.

---

## 📜 License & Author

* **Project**: AlphaLens AI
* **Maintainer**: Aditya Mule ([@Aditya-mule](https://github.com/Aditya-mule))
* **License**: MIT License
