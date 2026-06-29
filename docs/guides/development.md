# Goodly — Development Guide

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 20+
- MongoDB (local or Atlas)
- Google Gemini API key
- Stripe test keys (optional for billing)

### Setup

```bash
# Clone the repository
git clone https://github.com/goodly/goodly.git
cd goodly

# Backend setup
cd backend
python3 -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys

# Frontend setup
cd ../frontend
npm install --legacy-peer-deps
```

### Running Locally

```bash
# Terminal 1: Backend
cd backend
source venv/bin/activate
uvicorn server:app --reload --port 8001

# Terminal 2: Frontend
cd frontend
npm start  # Runs on port 3000
```

### Running Tests

```bash
# Backend tests (requires running backend)
cd backend
pytest tests/ -v

# Frontend tests
cd frontend
npm test
```

## Project Structure

```
goodly/
├── backend/
│   ├── server.py          # FastAPI application (all endpoints)
│   ├── auth.py            # JWT authentication
│   ├── billing.py         # Stripe plans and checkout
│   ├── ai_service.py      # SEO AI tools (meta tags, keywords, competitors)
│   ├── social_service.py  # Social media audit AI
│   ├── ai_visibility.py   # AI assistant visibility simulation
│   ├── gbp_service.py     # Google Business Profile audit AI
│   ├── llm_client.py      # Shared Gemini LLM client
│   ├── seo_analyzer.py    # On-page SEO analysis
│   ├── serp.py            # SERP rank tracking
│   ├── social_fetcher.py  # Social profile scraping
│   ├── pdf_export.py      # PDF report generation
│   ├── email_service.py   # Email templates and sending
│   ├── scheduler.py       # Scheduled audit worker
│   ├── sanitize.py        # Input sanitization
│   ├── requirements.txt   # Python dependencies
│   ├── .env.example       # Environment template
│   └── tests/             # Backend test suite
├── frontend/
│   ├── src/
│   │   ├── App.js         # Root component + routing
│   │   ├── index.js       # React entry point
│   │   ├── pages/         # Page components (22 pages)
│   │   ├── components/    # Reusable components
│   │   │   ├── app/       # App-specific (AppLayout, Common, etc.)
│   │   │   └── ui/        # shadcn/ui components
│   │   ├── contexts/      # React contexts (AuthContext)
│   │   ├── hooks/         # Custom hooks (usePageMeta, use-toast)
│   │   ├── lib/           # Utilities (api.js, utils.js)
│   │   └── __tests__/     # Frontend test suite
│   ├── public/            # Static files
│   ├── package.json       # Node dependencies
│   └── craco.config.js    # CRA configuration
├── docs/                  # Documentation
├── scripts/               # Utility scripts
├── Dockerfile             # Multi-stage Docker build
├── cloudbuild.yaml        # Cloud Build configuration
├── .dockerignore          # Docker build exclusions
└── DEPLOYMENT.md          # Deployment checklist
```

## Coding Conventions

### Backend (Python)
- **Style:** Black with 88-char line length
- **Types:** Type hints on all function signatures
- **Async:** All database and API calls are async (Motor, httpx)
- **Errors:** HTTPException with descriptive messages
- **Logging:** `logger = logging.getLogger(__name__)` pattern

### Frontend (React)
- **Components:** Functional components with hooks
- **Styling:** Tailwind CSS with Goodly design tokens
- **Colors:** `#2D3E32` (primary), `#E07A5F` (accent), `#81B29A` (sage), `#FDFBF7` (bg)
- **Fonts:** Cabinet Grotesk (headings), Outfit (body)
- **Testing:** data-testid attributes on interactive elements
- **API:** Axios with `withCredentials: true` for cookie auth

## Adding a New Feature

1. **Backend endpoint:** Add to `server.py` with Pydantic model, rate limit decorator, and auth dependency
2. **AI service:** If using AI, add prompt function to appropriate service file
3. **Frontend page:** Create in `pages/`, add route in `App.js`, add nav item in `AppLayout.jsx`
4. **Tests:** Add backend test in `tests/`, frontend test in `__tests__/`
5. **Docs:** Update API reference in `docs/api/reference.md`

## Common Tasks

### Adding a new AI-powered feature
```python
# 1. Add prompt function in appropriate service file
from llm_client import ask_json, DEFAULT_MODEL

async def my_new_feature(input_data: str) -> dict:
    prompt = f"Analyze this: {input_data}\nReturn JSON with..."
    return await ask_json(prompt, system_message="You are an expert...")

# 2. Add endpoint in server.py
class MyFeatureIn(BaseModel):
    input_data: str

@api.post("/my-feature")
@limiter.limit("10/minute")
async def my_feature(body: MyFeatureIn, user: dict = Depends(get_current_user_doc)):
    result = await my_service.my_new_feature(body.input_data)
    return result
```

### Adding a new database collection
```python
# 1. Add index in on_startup
await db.my_collection.create_index([("user_id", 1), ("created_at", -1)])

# 2. Use in endpoint
doc = {"id": str(uuid.uuid4()), "user_id": user["id"], ...}
await db.my_collection.insert_one(doc)
```
