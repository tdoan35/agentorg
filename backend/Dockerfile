FROM --platform=linux/arm64 public.ecr.aws/docker/library/python:3.12-slim-bookworm

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install specific AgentCore and OTel libs
RUN pip install bedrock-agentcore aws-opentelemetry-distro

# Copy agent code and tools
COPY app/*.py ./

# OpenTelemetry Configuration for AWS CloudWatch GenAI Observability
ENV OTEL_PYTHON_DISTRO=aws_distro
ENV OTEL_PYTHON_CONFIGURATOR=aws_configurator
ENV OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
ENV OTEL_TRACES_EXPORTER=otlp
ENV OTEL_EXPORTER_OTLP_LOGS_HEADERS=x-aws-log-group=agents/agentorg-logs,x-aws-log-stream=default,x-aws-metric-namespace=agents
ENV OTEL_RESOURCE_ATTRIBUTES=service.name=agentorg
ENV AGENT_OBSERVABILITY_ENABLED=true

# Expose the port that AgentCore Runtime expects
EXPOSE 8080

# Run the agent directly to see logs
CMD ["python", "agentcore_entrypoint.py"]
