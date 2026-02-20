from strands.tools import tool


@tool
def request_from_agent(input: str) -> str:
    """Request data or action from another agent."""
    return f"Request sent: {input}"


@tool
def summarize_report(input: str) -> str:
    """Summarize a report or data."""
    return f"Summary: {input[:100]}..."


TOOLS = {
    "request_from_agent": request_from_agent,
    "summarize_report": summarize_report,
}
