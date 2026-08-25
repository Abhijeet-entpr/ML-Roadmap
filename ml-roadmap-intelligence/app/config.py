from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "ml-roadmap-intelligence"
    min_weeks: int = 6
    max_weeks: int = 24
    catalog_path: str = "data/catalog/modules.json"
    role_targets_path: str = "data/catalog/role_targets.json"
    diagnostics_path: str = "data/diagnostics/banks.json"

    class Config:
        env_prefix = "INTEL_"


settings = Settings()
