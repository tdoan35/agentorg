from aws_cdk import (
    Stack,
    aws_iam as iam,
    aws_ecr as ecr,
    aws_ecr_assets as ecr_assets,
    CfnOutput,
    CfnResource,
    RemovalPolicy,
)
import aws_cdk as cdk
from constructs import Construct
import path

class AgentOrgStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # 1. ECR Repository for the Agent
        repository = ecr.Repository(
            self, "AgentRepo",
            repository_name="agentorg-repo",
            removal_policy=RemovalPolicy.DESTROY,
            empty_on_delete=True
        )

        # 2. Docker Image Asset (Build and Push)
        # Note: This requires Docker to be running on the deployment machine
        image_asset = ecr_assets.DockerImageAsset(
            self, "AgentImageAsset",
            directory=".", # Root where Dockerfile and requirements.txt are
            platform=ecr_assets.Platform.LINUX_ARM64
        )

        # 3. IAM Role for AgentCore Runtime
        agent_role = iam.Role(
            self, "AgentCoreRole",
            assumed_by=iam.ServicePrincipal("bedrock-agentcore.amazonaws.com"),
            description="Role for Amazon Bedrock AgentCore Runtime"
        )

        # Allow AgentCore to invoke Bedrock models
        agent_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "bedrock:InvokeModel",
                    "bedrock:InvokeModelWithResponseStream"
                ],
                resources=["*"]
            )
        )
        
        # Allow AgentCore to pull from ECR
        repository.grant_pull(agent_role)
        # Allow AgentCore to pull the asset image (it's in a different repo)
        image_asset.repository.grant_pull(agent_role)

        # 4. AgentCore Runtime (using CfnResource as fallback)
        # Type: AWS::Bedrock::AgentRuntime (Hypothetical or future)
        # For now, we follow the boto3 structure for CfnResource
        
        agent_runtime = CfnResource(
            self, "AgentOrgRuntime",
            type="AWS::Bedrock::AgentRuntime", # Verify this if possible, otherwise use a placeholder
            properties={
                "AgentRuntimeName": "AgentOrgRuntime",
                "RoleArn": agent_role.role_arn,
                "AgentRuntimeArtifact": {
                    "ContainerConfiguration": {
                        "ContainerUri": image_asset.image_uri
                    }
                },
                "NetworkConfiguration": {
                    "NetworkMode": "PUBLIC"
                },
                "LifecycleConfiguration": {
                    "MaxLifetime": 60 # Minutes
                },
                "EnvironmentVariables": {
                    "AWS_DEFAULT_REGION": self.region
                }
            }
        )

        # 5. Outputs
        CfnOutput(
            self, "AgentRuntimeId",
            value=agent_runtime.ref,
            description="The ID of the AgentCore Runtime"
        )
        CfnOutput(
            self, "ImageUri",
            value=image_asset.image_uri,
            description="The URI of the Docker image"
        )
