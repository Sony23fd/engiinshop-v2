import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const productId = formData.get("productId") as string | null
    const isVariant = formData.get("isVariant") === "true"

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 })
    }

    // Validate file type
    const isImage = file.type.startsWith("image/")
    const isVideo = file.type === "video/mp4" || file.type === "video/webm" || file.type.startsWith("video/")

    if (!isImage && !isVideo) {
      return NextResponse.json({ error: "Only images or videos (MP4/WebM) are allowed" }, { status: 400 })
    }

    // Max 5MB for images, Max 15MB for videos
    const maxSize = isVideo ? 15 * 1024 * 1024 : 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: `File too large (max ${isVideo ? '15MB' : '5MB'})` }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    let buffer = Buffer.from(bytes)

    // Save to /public/uploads/products/
    const uploadsDir = join(process.cwd(), "public", "uploads", "products")
    await mkdir(uploadsDir, { recursive: true })

    let ext = file.name.split(".").pop() ?? (isVideo ? "mp4" : "jpg")

    // Optimize images automatically to WebP with Sharp (reduce 5MB -> ~100KB)
    if (isImage) {
      try {
        const sharp = (await import("sharp")).default
        buffer = await sharp(buffer)
          .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer()
        ext = "webp"
      } catch (sharpError) {
        console.warn("Sharp WebP conversion skipped, using original:", sharpError)
      }
    }

    const filenamePrefix = productId || (isVariant ? "variant" : "product")
    const filename = `${filenamePrefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`
    const filepath = join(uploadsDir, filename)

    await writeFile(filepath, buffer)

    const fileUrl = `/uploads/products/${filename}`

    // Update product.imageUrl or videoUrl in DB ONLY IF productId is present AND isVariant is false
    if (productId && !isVariant) {
      await db.product.update({
        where: { id: productId },
        data: isVideo ? { videoUrl: fileUrl } : { imageUrl: fileUrl }
      })
    }

    return NextResponse.json({ success: true, url: fileUrl, imageUrl: fileUrl, videoUrl: isVideo ? fileUrl : undefined, type: isVideo ? "video" : "image" })
  } catch (error: any) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: error.message ?? "Upload failed" }, { status: 500 })
  }
}
