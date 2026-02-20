# Simple Strands Agent for AgentCore
import os
import logging
import sys
from strands import Agent
from strands.models import BedrockModel

# Configure logging to stdout
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

system_prompt = '''
You are a helpful assistant. Respond ONLY in JSON format.
Schema:
{
  "status": "string",
  "message": "string"
}
'''

def create_agent():
    model = BedrockModel(
        model_id="us.amazon.nova-lite-v1:0",
        streaming=False
    )
    
    return Agent(
        model=model,
        system_prompt=system_prompt,
        tools=[] # Basic version with no tools
    )

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
        return {
            "status": "Error",
            "message": "Internal error occurred."
        }
