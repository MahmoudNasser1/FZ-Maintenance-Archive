from typing import List, Union
from pydantic import AnyHttpUrl, PostgresDsn, validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    APP_NAME: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    REFRESH_TOKEN_EXPIRE_DAYS: int
    
    # CORS Configuration
    BACKEND_CORS_ORIGINS: List[Union[str, AnyHttpUrl]] = []

    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Database Configuration
    DATABASE_URL: PostgresDsn
    TEST_DATABASE_URL: PostgresDsn

    # File Storage Configuration
    UPLOAD_DIRECTORY: str
    MAX_UPLOAD_SIZE: int

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
