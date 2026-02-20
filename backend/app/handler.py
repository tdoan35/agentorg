import asyncio
import json
import logging
from aws_lambda_powertools import Logger
from agent import run_agent

logger = Logger()

@logger.inject_lambda_context
def handler(event, context):
    logger.info("Received event: %s", event)
    
    # Get query from event body or use default
    body = event.get('body', '{}')
    if isinstance(body, str):
        try:
            body_dict = json.loads(body)
        except json.JSONDecodeError:
            body_dict = {}
    else:
        body_dict = body
        
    query = body_dict.get('query', "Hello! How can I assist you with AgentOrg today?")
    
    # Run the agent
    result = run_agent(query)
    
    # strands result object has .content or similar
    # Let's assume it has .content for simplicity
    try:
        response_text = result.content if hasattr(result, 'content') else str(result)
    except Exception as e:
        response_text = f"Error processing result: {str(e)}"

    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Success',
            'query': query,
            'response': response_text
        })
    }
