# Product & Technical Requirements: AlphaLens AI

This document specifies the functional, technical, and non-functional requirements for the **AlphaLens AI** investment research platform.

---

## 1. Functional Requirements

### 1.1 Authentication & User Management
* **Signup & Log In**: Standard email/password flow. High-entropy password hashing (bcrypt/argon2).
* **Google OAuth**: Alternative sign-in mechanism returning a JWT after successful verification.
* **Session Management**: Access tokens (JWT, short-lived, 15m) and secure HttpOnly refresh tokens (long-lived, 7 days) stored in Redis for revocation checks.
* **Profiles**: Users can edit their research profiles (e.g., preferred sectors, risk profile, watchlist alerts).

### 1.2 Company Search
* **Search Index**: Real-time autocomplete searching by ticker symbol (e.g., AAPL) or company name.
* **Profile Views**: Render company summary, sector, industry, stock price charts, and high-level description.
* **Financial Data**: Fetch and render key statements:
  * Balance Sheet (Assets, Liabilities, Equity)
  * Income Statement (Revenue, Net Income, Operating Margins)
  * Cash Flow Statement (Free Cash Flow, Operating Cash Flow)
* **Interactive Visualizations**: Time-series charts showing stock price trends and financial ratios over time (e.g., P/E, EV/EBITDA, Net Margin).

### 1.3 AI Fundamental Analysis
* **Structured PDF/JSON Reports**: Instead of unstructured chat text, the system provides formatted, deep-dive analytical sections covering:
  1. *Overview*: Brief macro thesis and product breakdown.
  2. *Revenue & Profit Growth*: Year-over-Year (YoY) metrics, driver analysis.
  3. *Margins & Ratios*: ROE, ROCE, Gross Margin, Operating Margin.
  4. *Debt & Liquidity*: Debt-to-Equity, Interest Coverage, Cash Reserves.
  5. *Valuation*: Multiple comparisons vs. historical and peer averages.
  6. *Ownership*: Institutional vs. retail breakdown, insider trading alerts.
  7. *Risks & Opportunities*: SWOT/SWIFT analysis style summaries.
  8. *Peer Comparison*: Direct matrix comparing margins and valuation.
* **Microservices Protocol**: Node.js backend fetches structured data (from database/external API), sends a JSON payload to the Python AI service, and receives back a strictly-typed JSON response matching a specific Pydantic schema.

### 1.4 AI Company Chat (RAG)
* **Contextual Conversations**: Natural language chat interface scoped to selected companies.
* **Retrieval-Augmented Generation (RAG)**:
  * Retrieve semantic context from SEC filings, earnings transcripts, and internal analyst notes stored in Qdrant.
  * Supplement context with historical financial table metrics.
  * Cite sources (e.g., "SEC 10-K FY2025, Page 42").
* **Chat History**: Persist chat sessions in PostgreSQL for seamless resumption.

### 1.5 Document Upload & Vectorization
* **PDF Extraction**: Safe uploading of quarterly filings (10-Q), annual reports (10-K), and earnings presentations.
* **Processing Pipeline**:
  * Extract text cleanly using Python tools (`PyPDF` or `pdfplumber`).
  * Chunk text dynamically using semantic or overlapping chunkers (e.g., chunk size 1000 characters, overlap 200).
  * Generate high-quality embeddings (e.g., `text-embedding-3-small` or local HuggingFace models).
  * Store chunks and vectors in a Qdrant collection with payload metadata (`companyId`, `documentType`, `fiscalYear`).
  * Save status, filename, page count, and indexing state in PostgreSQL.

### 1.6 Portfolio Analyzer
* **Creation & Tracking**: Add multiple portfolios with tickers, quantities, and purchase prices.
* **Risk Intelligence**:
  * Diversification index (Herfindahl-Hirschman Index / HHI).
  * Sector, industry, and asset-class allocation charts.
  * Valuation heatmap (e.g., high P/E skew warning).
  * Concentration risks (e.g., >30% weight in a single stock).
* **AI Audit**: Generate an AI review summarizing portfolio strengths, weaknesses, and optimization paths.

### 1.7 Company Comparison
* **Side-by-Side Matrix**: Select up to 4 companies for cross-comparison.
* **Metric Overviews**: Compare trailing P/E, forward P/E, debt-to-equity, profit margins, and revenue CAGR.
* **AI Summarization**: Generate a readable thesis outlining who is leading in quality, growth, or valuation.

### 1.8 News Intelligence
* **Aggregator**: Pull financial news feeds via REST API.
* **AI Enrichment**:
  * Generate bulleted, objective summaries.
  * Perform sentiment analysis (positive, neutral, negative score from -1.0 to +1.0).
  * Cluster related news events (e.g., clustering 12 articles about an earnings beat into one story cluster).
  * Predict potential stock price impact category (Low, Medium, High).

### 1.9 Smart Stock Screener
* **Hybrid Search**: Combining traditional filters (P/E < 20, Debt-to-Equity < 0.5) with natural language commands (e.g., "Find high-growth SaaS companies with clean balance sheets").
* **Execution**: Translate natural language queries into SQL database parameters and Qdrant payload filters.

### 1.10 Watchlist & Background Sync
* **Watchlist**: Save target companies for quick access.
* **Background Jobs (BullMQ)**:
  * Sync stock price data daily.
  * Monitor SEC filings and trigger alerts when new documents are indexed.
  * Fetch and cache latest news articles hourly.

---

## 2. Technical & Non-Functional Requirements

### 2.1 Security & Access Control
* **JWT Protocol**: Secure validation middleware verifying access tokens on all protected routes.
* **Role-Based Access Control (RBAC)**: User roles (`FREE_USER`, `PREMIUM_USER`, `ADMIN`). Watchlist/upload features restricted or rate-limited for free tier.
* **API Protection**:
  * Helmet.js for security headers.
  * Rate-limiting (100 requests per 15 minutes per IP; stricter limits for AI endpoints).
  * Input validation using `Zod` (Node.js) and `Pydantic` (FastAPI).

### 2.2 Performance & Scalability
* **Caching Strategy**: Redis holds hot company financial profiles, live news feeds, and session tokens. Cache invalidation on background sync.
* **Microservice Isolation**: The Node.js Express server acts as a gateway; it must NEVER load heavy LLM or embedding models directly to preserve low CPU usage and high concurrent connection handling.
* **Database Optimization**:
  * PostgreSQL indexes on critical fields (`ticker`, `userId`, `portfolioId`).
  * Prisma ORM transaction pools configured to avoid bottlenecks.

### 2.3 System Resilience & Error Handling
* **Graceful Degradation**: If the FastAPI AI service is offline, the backend should serve cached financials and display a clean "AI analysis temporarily unavailable" notice instead of crashing.
* **Transaction Safety**: Document processing updates are transactional; failed processing states must mark documents as `FAILED` in the database to prevent orphaned records.
* **Logging**: Structured Winston/Morgan logging in Node.js, Loguru/structlog in Python, capturing traceback details for server issues.
