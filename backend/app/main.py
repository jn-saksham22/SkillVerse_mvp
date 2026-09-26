from contextlib import asynccontextmanager

from app.api.compatibility import router as compatibility_router
from app.api.action_center import router as action_layer_router
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.final_features.routes import router as final_features_router

from app.db.session import Base, engine
from app.models import models  # noqa: F401
from app.final_features import models as final_feature_models  # noqa: F401

from app.core.config import settings


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Importing the API must not connect to or mutate the database. Create
    # missing prototype tables when the service starts, after configuration
    # and the database service are available.
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        x.strip()
        for x in settings.cors_origins.split(",")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(router)
app.include_router(action_layer_router)
app.include_router(final_features_router)

app.include_router(compatibility_router, prefix="/api")
