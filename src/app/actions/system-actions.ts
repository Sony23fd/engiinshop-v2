"use server"

import { exec } from "child_process"
import { promisify } from "util"
import { getIronSession } from "iron-session"
import { cookies } from "next/headers"
import type { AdminSessionData } from "@/lib/session"

const execAsync = promisify(exec)

// Define session options (must match middleware.ts exactly)
const SESSION_OPTIONS = {
  password: process.env.SESSION_SECRET || "anar-shop-secret-key-must-be-at-least-32-chars!!",
  cookieName: "anar-admin-session",
}

export async function updateSystemFromServer() {
  try {
    // 1. Verify Authentication & Authorization (Authorization: Only DATAADMIN)
    const session = await getIronSession<AdminSessionData>(await cookies(), SESSION_OPTIONS)
    
    if (!session.isLoggedIn || session.role !== "DATAADMIN") {
      return { success: false, error: "Танд энэ үйлдлийг хийх эрх байхгүй байна." }
    }

    // 2. Prepare the SAFE command sequence
    // Note: We specifically EXCLUDE 'git clean -fd' to protect user uploads (public/uploads)
    const commands = [
      "cd /var/www/engiinshop",
      "git fetch --all",
      "git reset --hard origin/main",
      "npm install",
      "npx prisma generate",
      "npx prisma db push",
      "npx tsx fix-invalid-phones.ts",
      "npx tsx import-verified-phones.ts",
      "npm run build",
      "pm2 restart engiinshop"
    ].join(" && ")

    console.log("Starting System Update via Admin Dashboard...")

    // 3. Execute the command sequence
    // Note: pm2 restart will eventually terminate the current process, so we might not be able to send a full JSON response
    // if the restart happens before the response is fully buffered. But we trigger it anyway.
    
    // Using execAsync for the build process
    const { stdout, stderr } = await execAsync(commands)
    
    console.log("System Update Stdout:", stdout)
    if (stderr) console.error("System Update Stderr:", stderr)

    return { 
      success: true, 
      message: "Систем амжилттай шинэчлэгдэж байна. Сайт хэдэн секундын дараа дахин идэвхжих болно.",
      output: stdout 
    }
  } catch (error: any) {
    console.error("System Update Error:", error)
    return { 
      success: false, 
      error: error.message || "Шинэчлэх явцад алдаа гарлаа. Сервер ачаалал ихтэй байх магадлалтай." 
    }
  }
}
