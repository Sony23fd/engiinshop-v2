import { NextRequest, NextResponse } from "next/server"
import { join } from "path"
import { existsSync, readFileSync } from "fs"
import { stat } from "fs/promises"

export const dynamic = "force-dynamic"

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".pdf": "application/pdf"
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params
    const filePathArray = resolvedParams.path || []
    
    // Construct the absolute path to public/uploads/...
    // Note: We use process.cwd() to get the project root safely
    const absolutePath = join(process.cwd(), "public", "uploads", ...filePathArray)

    // Security check to prevent directory traversal
    if (!absolutePath.startsWith(join(process.cwd(), "public", "uploads"))) {
      return new NextResponse("Access denied", { status: 403 })
    }

    if (!existsSync(absolutePath)) {
      return new NextResponse("File not found", { status: 404 })
    }

    const fileStat = await stat(absolutePath)
    if (!fileStat.isFile()) {
      return new NextResponse("File not found", { status: 404 })
    }

    const ext = absolutePath.match(/\.[^.]+$/)?.[0]?.toLowerCase() || ""
    const mimeType = MIME_TYPES[ext] || "application/octet-stream"

    const fileBuffer = readFileSync(absolutePath)

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (error) {
    console.error("Error serving uploaded file:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
