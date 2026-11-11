# Member 5 Demo Script (Spending Control + Trusted Approval)

**Start the server** (from the `backend` folder):

```
python -m uvicorn app.main:app --reload
```

**Swagger UI:** http://localhost:8000/docs

Click Execute only once per step.

## Steps

1. **Register the agent:** `POST /spending/agents`
   ```json
   {"agent_id":"agent1","name":"Shopping Bot"}
   ```

2. **Set the spending policy:** `PUT /spending/policy/agent1`
   ```json
   {"weekly_limit":1000,"monthly_limit":3000,"categories":["groceries"],"approval_above":50}
   ```

3. **Add a trusted family contact:** `POST /approvals/contacts/agent1`
   ```json
   {"name":"Sonali","email":"<family-email>"}
   ```

4. **Small purchase ($20 -> approved):** `POST /spending/check`
   ```json
   {"agent_id":"agent1","amount":20,"category":"groceries","merchant":"BigBasket"}
   ```

5. **Large purchase ($80 -> needs approval, email alert sent):** `POST /spending/check`
   ```json
   {"agent_id":"agent1","amount":80,"category":"groceries","merchant":"BigBasket"}
   ```

6. **Over the limit ($5000 -> blocked):** `POST /spending/check`
   ```json
   {"agent_id":"agent1","amount":5000,"category":"groceries","merchant":"BigBasket"}
   ```

7. **Family member approves:** `POST /approvals/{approval_id}/approve`
   (use the `approval_id` returned in step 5)

## Notes

- Data is saved in JSON files, so it survives a server restart.
- For a clean demo, reset the `*_data.json` files in the `backend` folder before starting.