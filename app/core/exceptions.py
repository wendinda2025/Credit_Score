"""
Gestion centralisée des exceptions personnalisées
"""
from typing import Any, Optional
from fastapi import HTTPException, status


class BaseAppException(Exception):
    """Exception de base pour l'application"""
    
    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[dict[str, Any]] = None
    ):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class ValidationError(BaseAppException):
    """Exception pour les erreurs de validation"""
    
    def __init__(self, message: str, details: Optional[dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details=details
        )


class NotFoundError(BaseAppException):
    """Exception pour les ressources non trouvées"""
    
    def __init__(self, resource: str, identifier: Any):
        super().__init__(
            message=f"{resource} avec l'identifiant '{identifier}' non trouvé",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"resource": resource, "identifier": str(identifier)}
        )


class UnauthorizedError(BaseAppException):
    """Exception pour les erreurs d'autorisation"""
    
    def __init__(self, message: str = "Non autorisé"):
        super().__init__(
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED
        )


class ForbiddenError(BaseAppException):
    """Exception pour les accès interdits"""
    
    def __init__(self, message: str = "Accès interdit"):
        super().__init__(
            message=message,
            status_code=status.HTTP_403_FORBIDDEN
        )


class ConflictError(BaseAppException):
    """Exception pour les conflits de ressources"""
    
    def __init__(self, message: str, details: Optional[dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_409_CONFLICT,
            details=details
        )


class DatabaseError(BaseAppException):
    """Exception pour les erreurs de base de données"""
    
    def __init__(self, message: str, details: Optional[dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details=details
        )


def handle_app_exception(exc: BaseAppException) -> HTTPException:
    """Convertit une exception de l'application en HTTPException FastAPI"""
    return HTTPException(
        status_code=exc.status_code,
        detail={
            "message": exc.message,
            "details": exc.details
        }
    )
