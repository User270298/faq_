from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from routers import faq_router, tariffs_router, applications_router
from config import settings

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    description="API для FAQ и тарифов",
    version="1.0.0",
    debug=settings.debug
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Единый обработчик ошибок валидации: превращает ошибки Pydantic в строковый detail
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError):
    try:
        errors = exc.errors() if hasattr(exc, 'errors') else []
        messages = []
        for err in errors:
            loc = err.get('loc', [])
            msg = err.get('msg', 'Invalid input')
            # Убираем технические части местоположения (body/query/path)
            filtered = [str(x) for x in loc if x not in ('body', 'query', 'path')]
            field_path = ".".join(filtered)
            if field_path:
                messages.append(f"{field_path}: {msg}")
            else:
                messages.append(msg)
        text = "; ".join(messages) if messages else "Validation error"
        return JSONResponse(status_code=422, content={"detail": text, "errors": errors})
    except Exception:
        # Фоллбэк на случай непредвиденного формата ошибок
        return JSONResponse(status_code=422, content={"detail": "Validation error"})

# Include routers
app.include_router(faq_router, prefix="/api/faq", tags=["FAQ"])
app.include_router(tariffs_router, prefix="/api/tariffs", tags=["Tariffs"])
app.include_router(applications_router, prefix="/api/applications", tags=["Applications"])

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": f"{settings.app_name} is running",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": settings.app_name}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        log_level="info"
    )


