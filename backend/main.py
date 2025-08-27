# FastAPI main application - placeholder for future implementation
from fastapi import FastAPI

app = FastAPI(title="Wireshark+ Web API", version="0.1.0")

@app.get("/")
async def root():
    return {"message": "Wireshark+ Web API"}