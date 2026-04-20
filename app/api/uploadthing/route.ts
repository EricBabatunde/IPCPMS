import { createRouteHandler } from "uploadthing/next"
import { ourFileRouter } from "@/lib/uploadthing"

export const dynamic = 'force-dynamic';
// Export routes for Next App Router
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  config: {
    token: process.env.UPLOADTHING_TOKEN, // v7 standard
  },
});
