from __future__ import annotations

import os
from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # AWS / Bedrock
    aws_region: str = "us-west-2"
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_session_token: str = ""
    bedrock_model_id: str = "us.anthropic.claude-3-5-sonnet-20241022-v2:0"

    # Neo4j
    neo4j_uri: str = "bolt://localhost:7687"
    neo4j_user: str = "neo4j"
    neo4j_password: str = "agentorg123"

    # Datadog
    dd_service: str = "agentorg"
    dd_env: str = "hackathon"
    dd_api_key: str = ""
    dd_agent_host: str = "localhost"

    # App
    app_port: int = 8000
    frontend_url: str = "http://localhost:3000"

    model_config = {"env_file": os.path.join(os.path.dirname(__file__), "..", ".env")}


@lru_cache
def get_settings() -> Settings:
    return Settings()
