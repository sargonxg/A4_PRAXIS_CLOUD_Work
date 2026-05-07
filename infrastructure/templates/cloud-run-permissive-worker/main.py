from fastapi import FastAPI

app = FastAPI(title="PRAXIS isolated worker")


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok"}
