from app.paypal.routes import router as paypal_router

app.include_router(paypal_router)
