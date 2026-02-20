import asyncio
import sys
import logging
from agent import run_agent

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)

logger = logging.getLogger(__name__)

def main():
    if len(sys.argv) > 1:
        query = " ".join(sys.argv[1:])
    else:
        query = "Hello! How can I assist you with AgentOrg today?"
        
    logger.info("Running agent with query: %s", query)
    try:
        result = run_agent(query)
        # Assuming the result has a .content attribute like in strands
        response = result.content if hasattr(result, 'content') else str(result)
        logger.info("Agent Response: %s", response)
    except Exception as e:
        logger.error("Error running agent: %s", e, exc_info=True)

if __name__ == "__main__":
    main()
