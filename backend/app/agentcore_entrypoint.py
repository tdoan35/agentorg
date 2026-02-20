# Entry point for Amazon Bedrock AgentCore
from bedrock_agentcore.runtime import BedrockAgentCoreApp
import example_agents

app = BedrockAgentCoreApp()


@app.entrypoint
def handler(payload):
    """AgentCore handler function"""
    agent_type = payload.get("agent_type", "finance")
    prompt = payload.get("prompt", "Hello, who are you?")

    if agent_type == "analytics":
        return example_agents.run_analytics_agent(prompt)
    return example_agents.run_finance_agent(prompt)


if __name__ == "__main__":
    app.run()
