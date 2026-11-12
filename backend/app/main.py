from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from app.api import policies, approvals
from app.paypal import routes as paypal_routes

app = FastAPI(title="PayGuard")
app.include_router(policies.router)
app.include_router(approvals.router)
app.include_router(paypal_routes.router)