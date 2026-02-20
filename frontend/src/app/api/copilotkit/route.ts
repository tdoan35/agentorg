import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

export const POST = async (req: Request) => {
  const runtime = new CopilotRuntime({
    remoteEndpoints: [
      {
        url: `${BACKEND_URL}/api/copilotkit`,
      },
    ],
  });

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
