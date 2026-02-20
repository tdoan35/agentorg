import aws_cdk as core
import aws_cdk.assertions as assertions

from agentorg.agentorg_stack import AgentOrgStack

# example tests. To run these tests, uncomment this file along with the example
# resource in agentorg/agentorg_stack.py
def test_sqs_queue_created():
    app = core.App()
    stack = AgentOrgStack(app, "agentorg")
    template = assertions.Template.from_stack(stack)

#     template.has_resource_properties("AWS::SQS::Queue", {
#         "VisibilityTimeout": 300
#     })
