# PayGuard Combined Project

Combines the React + TypeScript + Vite frontend (`src/`) with the FastAPI AI fraud-analysis backend (`backend/`). The supplied auth/payment tests are preserved separately in `reference-tests/auth-payments/`.

## Run frontend
```bash
npm install
npm run dev
```

## Run backend (from project root)
```bash
python -m venv .venv
# Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload
```

API docs: http://localhost:8000/docs
Health: http://localhost:8000/api/v1/health

Set `VITE_API_BASE_URL` in a frontend `.env` file if the API is hosted somewhere other than `http://localhost:8000`. Optional model credentials belong in `backend/.env` (copy from `.env.example`). The uploaded backend `.env` was intentionally excluded because it may contain secrets. With no API key, the backend uses its deterministic local fallback.

## Integration status
- Scam Detection UI now calls `POST /api/v1/analyze` instead of the old simulated frontend analyzer.
- Current UI does not collect recipient name or currency, so the integration sends a generic recipient and USD.
- `pay2.zip` contains tests for auth/users/payments endpoints, not their implementation. Those tests are preserved in `reference-tests/auth-payments/` but are not runnable against the supplied fraud backend yet. The actual auth/payment backend source is still needed.
- Other frontend features (transactions, spending rules, trusted circle) retain their existing local/demo service behavior until matching backend endpoints are provided.
