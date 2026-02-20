#!/usr/bin/env python3
import os
import aws_cdk as cdk
from agentorg.agentorg_stack import AgentOrgStack

app = cdk.App()
AgentOrgStack(app, "AgentOrgStack",
    env=cdk.Environment(region="us-east-2"),
)

app.synth()
