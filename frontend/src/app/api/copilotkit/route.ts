import {
  CopilotRuntime,
  CopilotServiceAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";

class AgentCoreAdapter implements CopilotServiceAdapter {
  async process(request: any): Promise<any> {
    const lastMessage = request.messages[request.messages.length - 1];
    
    const res = await fetch("http://localhost:8080/invocations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: lastMessage.content }),
    });

    if (!res.ok) {
      throw new Error(`AgentCore error: ${res.status}`);
    }

    const rawResponse = await res.text();
    // Clean up response: remove thinking tags and quotes
    let cleaned = rawResponse.replace(/^"|"$/g, "").replace(/\\n/g, "\n").replace(/\\"/g, '"');
    cleaned = cleaned.replace(/<thinking>[\s\S]*?<\/thinking>\n?/, "").trim();

    // CopilotKit expects an object with threadId and response
    return {
      threadId: request.threadId || "default",
      response: {
        role: "assistant",
        content: cleaned,
      },
    };
  }
}

const serviceAdapter = new AgentCoreAdapter();

export const POST = async (req: Request) => {
  const runtime = new CopilotRuntime();

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
