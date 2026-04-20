import { auth } from "@/auth"
import { pusherServer } from "@/lib/pusher"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

    const body = await req.text()
    const params = new URLSearchParams(body)
    const socketId = params.get("socket_id")!
    const channelName = params.get("channel_name")!

    // Presence channels require user data
    if (channelName.startsWith("presence-")) {
      const presenceData = {
        user_id: session.user.id,
        user_info: { name: session.user.name, image: session.user.image },
      }
      const authResponse = pusherServer.authorizeChannel(socketId, channelName, presenceData)
      return NextResponse.json(authResponse)
    }

    // Private channels
    const authResponse = pusherServer.authorizeChannel(socketId, channelName)
    return NextResponse.json(authResponse)
  } catch (error) {
    console.error("[PUSHER_AUTH_ERROR]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
