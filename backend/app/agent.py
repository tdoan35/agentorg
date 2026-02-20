from strands import Agent
from strands.models import BedrockModel
import logging
import sys

from agent_factory import create_agent_from_spec, AgentSpec

# Configure logging to stdout
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)


def create_agent():
    model = BedrockModel(
        model_id=os.environ.get("BEDROCK_MODEL_ID", "us.anthropic.claude-3-5-sonnet-20241022-v2:0"),
        streaming=False
    )
    
    return Agent(
        model=model,
        system_prompt=system_prompt,
        tools=[] # Basic version with no tools
    )
    return create_agent_from_spec(spec)


def run_agent(prompt):
    """Process a request using the Strands agent"""
    try:
        agent = create_agent()
        response = agent(prompt)
        # Strands responses can be converted to string or accessed via .content
        return str(response)
    except Exception as e:
        import traceback

        print(f"ERROR: Exception in run_agent: {str(e)}")
        traceback.print_exc()
        return {"status": "Error", "message": "Internal error occurred."}
