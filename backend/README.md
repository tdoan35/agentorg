# AgentOrg Backend

This is the backend for AgentOrg, a multi-agent system built using AWS Strands Agents SDK and Amazon Bedrock AgentCore.

## Getting Started

### Prerequisites

- Python 3.12+
- Docker and Docker Compose
- AWS Credentials with access to Amazon Bedrock

### Configuration

1. Create a `.env` file in the `agentorg/backend` directory:
   ```bash
   cp .env.example .env
   ```
2. Fill in your AWS credentials and region in the `.env` file.

### Running with Docker (Recommended)

The easiest way to run the AgentCore runtime is using Docker Compose from the `agentorg` root directory:

```bash
cd agentorg
docker-compose up --build
```

The agent will be available at `http://localhost:8080`.

#### Testing the Docker Container

- **Health Check**:
  ```bash
  curl http://localhost:8080/ping
  ```
- **Invoke Agent**:
  ```bash
  curl -X POST http://localhost:8080/invocations \
       -H "Content-Type: application/json" \
       -d '{"prompt": "Hello!"}'
  ```

### Running Locally (CLI)

You can also run the agent logic directly from your terminal for quick testing:

1. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the CLI tool:
   ```bash
   cd app
   python main.py "Your query here"
   ```

## Project Structure

- `app/`: Core application logic
  - `agent.py`: Agent definition and factory
  - `agentcore_entrypoint.py`: Runtime entry point for Bedrock AgentCore
  - `main.py`: Local CLI entry point
  - `handler.py`: AWS Lambda handler
- `agentorg/`: CDK infrastructure code
- `tests/`: Unit tests
- `Dockerfile`: Container definition for AgentCore
- `docker-compose.yml`: Local orchestration (located in parent directory)
