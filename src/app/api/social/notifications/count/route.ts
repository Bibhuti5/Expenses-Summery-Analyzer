import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ count: 0 })

  const count = await prisma.notification.count({
    where: { userId: session.userId, read: false },
  })

  return Response.json({ count })
}
