from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from app.api import policies, approvals

app = FastAPI(title="PayGuard")
app.include_router(policies.router)
app.include_router(approvals.router)