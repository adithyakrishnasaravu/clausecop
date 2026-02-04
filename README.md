# ClauseCop

AI-powered contract risk analysis for SaaS and Master Service Agreements.

## The Problem

Legal and procurement teams spend hours manually reviewing vendor contracts — scanning for buried liability clauses, one-sided indemnification, auto-renewal traps, and weak data terms. Important risks get missed, and the review bottleneck slows down deal cycles.

## How ClauseCop Solves It

Upload a PDF contract and ClauseCop automatically reads, structures, and analyzes every clause. Within minutes you get a full risk profile — no legal expertise required to understand what's dangerous in the agreement.

### Features

- **Automated clause extraction** — PDF contracts are parsed and split into individual clauses with section numbers and page references, so nothing gets overlooked
- **Intelligent classification** — Each clause is categorized (indemnification, liability caps, termination, IP assignment, data privacy, SLAs, and more) using LLM-powered analysis
- **Proprietary risk scoring algorithm** — A multi-factor scoring engine evaluates each clause on a 0-100 scale across multiple risk dimensions, flagging severity as low, medium, high, or critical
- **Plain-English risk summaries** — Every flagged clause comes with a clear explanation of what it means and why it matters, written for business stakeholders, not just lawyers
- **Actionable negotiation recommendations** — Specific redline suggestions for each risky clause, so you know exactly what to push back on
- **Risk dashboard** — Visual overview with severity distribution charts, top risks, and safe clauses at a glance
- **Document management** — Upload, rename, and organize multiple contracts in a sidebar workspace
- **PDF report export** — Generate a downloadable risk analysis report to share with your team

## Architecture

```
┌──────────────┐        ┌─────────────────────────────────┐
│              │        │         FastAPI Backend          │
│    React     │        │                                 │
│  Frontend    │───────>│  PDF Parsing ─> Clause Extraction│
│              │        │  ─> LLM Classification          │
└──────────────┘        │  ─> Risk Analysis Engine         │
                        │  ─> Proprietary Scoring ─> DB   │
                        └─────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TypeScript, Material-UI, Recharts |
| Backend | Python, FastAPI, SQLModel, SQLite |
| AI | OpenAI GPT-4.1 |
| Document Parsing | Unstructured API |

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+
- [OpenAI API key](https://platform.openai.com/)
- [Unstructured API key](https://unstructured.io/)

### Setup

```bash
git clone https://github.com/your-username/clausecop.git
cd clausecop
cp .env.example .env   # fill in your API keys
```

**Backend:**

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

Check it out here: [https://clausecop-beta.vercel.app](https://clausecop-beta.vercel.app).

## API

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/documents/upload` | Upload a PDF for analysis |
| `GET` | `/documents/` | List all documents |
| `GET` | `/documents/{id}` | Document metadata |
| `PATCH` | `/documents/{id}` | Rename a document |
| `DELETE` | `/documents/{id}` | Delete document and all associated data |
| `GET` | `/documents/{id}/clauses` | Clauses with risk data |
| `GET` | `/documents/{id}/risk-summary` | Overall risk profile |
| `GET` | `/clauses/{id}` | Single clause detail |

## License

MIT
