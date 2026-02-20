# Entry point for Amazon Bedrock AgentCore
from bedrock_agentcore.runtime import BedrockAgentCoreApp
import agent

app = BedrockAgentCoreApp()

@app.entrypoint
def handler(payload):
    """AgentCore handler function"""
    # Payload usually has a 'prompt' key
    prompt = payload.get('prompt', 'Hello, who are you?')
    return agent.run_agent(prompt)

if __name__ == "__main__":
    app.run()
