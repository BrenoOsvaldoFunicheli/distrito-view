from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./distrito.db"
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]
    JWT_SECRET: str = "dev-secret-change-me"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_DAYS: int = 7
    AUTH_COOKIE_NAME: str = "distrito_auth"
    AUTH_COOKIE_SECURE: bool = False  # set True em produção (HTTPS)

    model_config = {"env_file": ".env"}


settings = Settings()
