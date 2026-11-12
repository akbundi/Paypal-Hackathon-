import httpx
http: httpx.AsyncClient = None  # set in lifespan
tasks: set = set()  # keeps background webhook deliveries alive
