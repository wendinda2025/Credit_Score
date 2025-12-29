from __future__ import annotations

import logging
import time
import uuid
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from credit_score.api.routes.applications import router as applications_router
from credit_score.core.config import settings
from credit_score.core.db import engine
from credit_score.core.logging import configure_logging
from credit_score.models import Base


def create_app() -> FastAPI:
    configure_logging()
    log = logging.getLogger("credit_score")

    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncIterator[None]:
        Base.metadata.create_all(bind=engine)
        log.info("startup_complete")
        yield

    app = FastAPI(title=settings.app_name, lifespan=lifespan)

    app.include_router(applications_router)

    @app.get("/health", tags=["health"])
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.middleware("http")
    async def request_context(request: Request, call_next):  # type: ignore[no-untyped-def]
        request_id = request.headers.get("x-request-id", str(uuid.uuid4()))
        start = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception:
            duration_ms = (time.perf_counter() - start) * 1000.0
            log.exception(
                "request_failed",
                extra={
                    "request_id": request_id,
                    "path": request.url.path,
                    "method": request.method,
                    "duration_ms": round(duration_ms, 2),
                },
            )
            raise
        duration_ms = (time.perf_counter() - start) * 1000.0
        log.info(
            "request",
            extra={
                "request_id": request_id,
                "path": request.url.path,
                "method": request.method,
                "status_code": response.status_code,
                "duration_ms": round(duration_ms, 2),
            },
        )
        response.headers["x-request-id"] = request_id
        return response

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        log.exception(
            "unhandled_exception",
            extra={"path": request.url.path, "method": request.method},
        )
        return JSONResponse(
            status_code=500,
            content={"error": "internal_server_error"},
        )

    return app


app = create_app()

