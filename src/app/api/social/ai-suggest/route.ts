import { streamText } from "ai"
import { getSession } from "@/lib/auth"
import { getLanguageModel } from "@/lib/provider"

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { prompt, tone = "casual" } = await req.json()

  const model = getLanguageModel()
  const result = streamText({
    model,
    messages: [
      {
        role: "system",
        content: `You are a helpful social media assistant. Generate 3 engaging post captions.
Tone: ${tone}.
Rules:
- Each caption must be under 280 characters
- Separate each caption with exactly "---" on its own line
- Do not number them or add labels
- Make them feel authentic and human, not corporate`,
      },
      {
        role: "user",
        content: prompt || "Write a short social media post caption",
      },
    ],
    maxTokens: 500,
  })

  return result.toDataStreamResponse()
}
