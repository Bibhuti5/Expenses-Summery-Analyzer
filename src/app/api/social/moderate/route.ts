import { generateText } from "ai"
import { getLanguageModel } from "@/lib/provider"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const secret = req.headers.get("x-moderation-secret")
  if (!process.env.MODERATION_SECRET || secret !== process.env.MODERATION_SECRET) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const { postId, content } = await req.json()
  if (!postId || !content) {
    return Response.json({ error: "Missing fields" }, { status: 400 })
  }

  try {
    const model = getLanguageModel()
    const result = await generateText({
      model,
      messages: [
        {
          role: "system",
          content: `You are a content moderator. Respond with JSON only, no markdown:
{"flagged": boolean, "reason": string | null}
Flag content containing: hate speech, explicit violence, targeted harassment, or illegal activity.
Do NOT flag: mild language, strong opinions, personal stories, humor.`,
        },
        { role: "user", content },
      ],
      maxTokens: 100,
    })

    const parsed = JSON.parse(result.text.replace(/```json|```/g, "").trim())

    if (parsed.flagged) {
      await prisma.post.update({
        where: { id: postId },
        data: { isModerated: true, moderationNote: parsed.reason ?? "Policy violation detected" },
      })
    }

    return Response.json({ flagged: parsed.flagged })
  } catch (err) {
    console.error("Moderation error:", err)
    return Response.json({ flagged: false })
  }
}
