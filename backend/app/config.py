from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./ready.db"
    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7

    admin_initial_username: str = "admin"
    admin_initial_password: str = "change-me-please"

    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:5105"]


settings = Settings()
