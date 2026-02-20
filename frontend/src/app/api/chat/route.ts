import { NextResponse } from "next/server";

const AGENTCORE_URL = process.env.AGENTCORE_URL ?? "http://localhost:8080";

export async function POST(req: Request) {
  const { message } = await req.json();

  const res = await fetch(`${AGENTCORE_URL}/invocations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: message }),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: text },
      { status: res.status }
    );
  }

  const data = await res.json();
  // AgentCore returns { status: "success", message: "..." }
  const reply =
    typeof data === "string"
      ? data
      : data.message ?? data.response ?? JSON.stringify(data);

  return NextResponse.json({ response: reply });
}
