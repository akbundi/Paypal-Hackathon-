import json


class FakeResp:
    def __init__(self, status=200, data=None):
        self.status_code, self._d = status, data if data is not None else {}
        self.text = json.dumps(self._d)

    def json(self):
        return self._d

    def raise_for_status(self):
        if self.status_code >= 400:
            raise RuntimeError(f"HTTP {self.status_code}")


class FakeHTTP:
    """Stand-in for the shared httpx client: records calls, answers via handler(url, kwargs)."""
    def __init__(self, handler):
        self.handler, self.calls = handler, []

    async def post(self, url, **kw):
        self.calls.append((url, kw))
        return self.handler(url, kw)

    async def aclose(self):
        pass
