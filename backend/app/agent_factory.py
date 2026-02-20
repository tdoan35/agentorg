from dataclasses import dataclass, field
from typing import Any, Callable
from strands import Agent
from strands.models import BedrockModel
import logging
import os

logger = logging.getLogger(__name__)


@dataclass
class AgentSpec:
    slug: str
    name: str
    role: str
    description: str
    model_id: str = ""
    system_prompt: str = ""
    tools: list = None
    data_access: list = None
    routing: list = None

    def __post_init__(self):
        if self.tools is None:
            self.tools = []
        if self.data_access is None:
            self.data_access = []
        if self.routing is None:
            self.routing = []

    def permissions_dict(self) -> dict[str, list[str]]:
        return {
            "dataAccess": list(self.data_access),
            "tools": list(self.tools),
            "routing": list(self.routing),
        }


class AgentFactory:
    _instance = None
    _registry: dict[str, type] = {}
    _tools_registry: dict[str, Callable] = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._registry = {}
            cls._instance._tools_registry = {}
        return cls._instance

    @classmethod
    def register(cls, agent_type: str, agent_class: type):
        cls._registry[agent_type] = agent_class
        logger.info(f"Registered agent type: {agent_type}")

    @classmethod
    def register_tools(cls, tools: dict[str, Callable]) -> None:
        cls._tools_registry.update(tools)

    @classmethod
    def build(cls, spec: AgentSpec) -> Agent:
        return cls.build_default(spec)

    @classmethod
    def create(cls, spec: AgentSpec | dict, agent_type: str = "default") -> Agent:
        if isinstance(spec, dict):
            spec = AgentSpec(**spec)

        if agent_type not in cls._registry:
            logger.warning(f"Agent type '{agent_type}' not found, using default")
            agent_type = "default"

        agent_class = cls._registry[agent_type]
        return agent_class.build(spec)

    @classmethod
    def build_default(cls, spec: AgentSpec) -> Agent:
        model_id = spec.model_id or os.environ.get(
            "BEDROCK_MODEL_ID", "us.anthropic.claude-3-5-sonnet-20241022-v2:0"
        )
        model = BedrockModel(model_id=model_id, streaming=False)

        system_prompt = spec.system_prompt or cls._build_system_prompt(spec)

        tools = cls._resolve_tools(spec.tools)

        return Agent(model=model, system_prompt=system_prompt, tools=tools)

    @classmethod
    def _build_system_prompt(cls, spec: AgentSpec) -> str:
        prompt = f"""You are {spec.name}, {spec.role}.
{spec.description}

You have access to the following tools: {", ".join(spec.tools) if spec.tools else "none"}.
Your data access scope: {", ".join(spec.data_access) if spec.data_access else "none"}.
You can route to these agents: {", ".join(spec.routing) if spec.routing else "none"}.
"""
        return prompt

    @classmethod
    def _resolve_tools(cls, tool_names: list) -> list:
        resolved = []
        for name in tool_names:
            # First check the orchestrator tools registry
            tool = cls._tools_registry.get(name)
            if tool:
                resolved.append(tool)
                continue
            # Fallback to tools module
            tool = cls._get_tool(name)
            if tool:
                resolved.append(tool)
        return resolved

    @classmethod
    def _get_tool(cls, name: str) -> Any:
        try:
            from app import tools as tools_mod
            return getattr(tools_mod, name, None)
        except ImportError:
            try:
                import tools
                return getattr(tools, name, None)
            except ImportError:
                return None


AgentFactory.register("default", AgentFactory)


def create_agent_from_spec(spec: AgentSpec | dict) -> Agent:
    return AgentFactory.create(spec)


def run_agent_from_spec(spec: AgentSpec | dict, prompt: str) -> str:
    try:
        agent = create_agent_from_spec(spec)
        response = agent(prompt)
        return str(response)
    except Exception as e:
        import traceback

        logger.error(f"Error running agent: {str(e)}")
        traceback.print_exc()
        return '{"status": "Error", "message": "Internal error occurred."}'
