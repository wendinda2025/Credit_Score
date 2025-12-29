"""
Point d'entrée principal de l'application FastAPI
"""
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.logging_config import setup_logging, get_logger
from app.core.exceptions import BaseAppException, handle_app_exception
from app.core.database import init_db
from app.api.v1 import api_router

# Configuration du logging
setup_logging()
logger = get_logger(__name__)

# Création de l'application FastAPI
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Application robuste pour la gestion de scores de crédit",
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Gestionnaire d'exceptions global
@app.exception_handler(BaseAppException)
async def app_exception_handler(request: Request, exc: BaseAppException):
    """Gère les exceptions personnalisées de l'application"""
    logger.error(
        "Exception de l'application",
        path=request.url.path,
        method=request.method,
        error=exc.message,
        details=exc.details
    )
    http_exc = handle_app_exception(exc)
    return JSONResponse(
        status_code=http_exc.status_code,
        content=http_exc.detail
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Gère les exceptions non prévues"""
    logger.error(
        "Exception non gérée",
        path=request.url.path,
        method=request.method,
        error=str(exc),
        exc_info=True
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "message": "Une erreur interne s'est produite",
            "details": {"error": str(exc)} if settings.DEBUG else {}
        }
    )


# Middleware de logging des requêtes
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log toutes les requêtes HTTP"""
    import time
    start_time = time.time()
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    logger.info(
        "Requête HTTP",
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
        process_time=f"{process_time:.3f}s"
    )
    
    return response


# Routes
app.include_router(api_router, prefix="/api")


@app.get("/", tags=["root"])
async def root():
    """Point d'entrée de l'API"""
    return {
        "message": f"Bienvenue sur {settings.APP_NAME}",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT
    }


@app.get("/health", tags=["health"])
async def health_check():
    """Vérification de santé de l'application"""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION
    }


# Événements de démarrage/arrêt
@app.on_event("startup")
async def startup_event():
    """Actions à effectuer au démarrage de l'application"""
    logger.info(
        "Démarrage de l'application",
        app=settings.APP_NAME,
        version=settings.APP_VERSION,
        environment=settings.ENVIRONMENT
    )
    # Initialiser la base de données si nécessaire
    # init_db()  # Décommenter si vous voulez créer les tables automatiquement


@app.on_event("shutdown")
async def shutdown_event():
    """Actions à effectuer à l'arrêt de l'application"""
    logger.info("Arrêt de l'application")
