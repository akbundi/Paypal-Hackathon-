"""Runs last: proves every API operation in the app was actually exercised by the suite.
Operations come from the OpenAPI spec (robust to how FastAPI nests included routers)."""
import re
from conftest import HITS
from main import app


def _operations():
    ops = []
    for path, item in app.openapi()["paths"].items():
        for method in item:
            if method.upper() in {"GET", "POST", "PUT", "PATCH", "DELETE"}:
                ops.append((method.upper(), path, re.compile("^" + re.sub(r"\{[^}]+\}", "[^/]+", path) + "$")))
    return ops


def test_every_operation_was_exercised():
    ops = _operations()
    assert len(ops) >= 45, f"only {len(ops)} operations discovered; route discovery is broken"
    missing = [f"{m} {p}" for m, p, rx in ops if not any(hm == m and rx.match(hp) for hm, hp in HITS)]
    assert not missing, "Operations never exercised by tests: " + ", ".join(sorted(missing))
