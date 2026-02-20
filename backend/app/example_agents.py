from agent_factory import create_agent_from_spec, AgentSpec

FINANCE_AGENT_SPEC = AgentSpec(
    slug="finance",
    name="Finance Agent",
    role="financial analyst",
    description="You are a financial analyst that specializes in analyzing financial data, generating reports, and providing financial insights.",
    model_id="us.amazon.nova-lite-v1:0",
    tools=["request_from_agent", "summarize_report"],
    data_access=["financial_db", "market_data"],
    routing=["analytics", "reporting", "trading"],
)

ANALYTICS_AGENT_SPEC = AgentSpec(
    slug="analytics",
    name="Analytics Agent",
    role="data analyst",
    description="You are a data analyst that specializes in analyzing metrics, generating insights, and creating visualizations from data.",
    model_id="us.amazon.nova-lite-v1:0",
    tools=["summarize_report"],
    data_access=["analytics_db", "logs"],
    routing=["finance", "reporting"],
)


def get_finance_agent():
    return create_agent_from_spec(FINANCE_AGENT_SPEC)


def get_analytics_agent():
    return create_agent_from_spec(ANALYTICS_AGENT_SPEC)


def run_finance_agent(prompt):
    agent = get_finance_agent()
    return agent(prompt)


def run_analytics_agent(prompt):
    agent = get_analytics_agent()
    return agent(prompt)


if __name__ == "__main__":
    print("Testing Finance Agent...")
    result = run_finance_agent("What are the current market trends?")
    print(f"Finance Agent: {result}")

    print("\nTesting Analytics Agent...")
    result = run_analytics_agent("What are the key performance metrics?")
    print(f"Analytics Agent: {result}")
