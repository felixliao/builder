import os

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from routers import chat, dataset, model
from starlette.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI()


@app.exception_handler(Exception)
async def validation_exception_handler(request: Request, exc: Exception):
    logger.error(f"unexcepted error: {exc} \nwith request: {request}")
    return JSONResponse(
        status_code=500,
        content={"message": f"unexcepted error: {exc}"},
    )


app.include_router(chat.router)
app.include_router(dataset.router)
app.include_router(model.router)

if __name__ == "__main__":
    uvicorn.run(host="0.0.0.0", port=8000, app=app)
