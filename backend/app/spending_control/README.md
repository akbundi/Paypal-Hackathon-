# Member 5 integration guide
Payment flow me purchase se pehle call karo:
  from app.spending_control import policy_engine
  result = policy_engine.evaluate(agent_id, amount, category, merchant)
  result["status"] -> "approved" | "needs_approval" | "blocked"
Alert: app.approvals.notifications.send_alert(contact, message)
Env var: ZAPIER_WEBHOOK_URL
Endpoints: /spending/*, /approvals/*
Include routers in main.py:
  app.include_router(policies.router); app.include_router(approvals.router)