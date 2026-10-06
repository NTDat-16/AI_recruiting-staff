import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tag, path, secret } = body;

    const expectedSecret =
      process.env.REVALIDATION_SECRET || "ai-recruiting-ats-revalidate-secret-2026";

    if (secret !== expectedSecret) {
      return NextResponse.json(
        { message: "Mã bí mật xác thực revalidation không hợp lệ." },
        { status: 401 }
      );
    }

    if (tag) {
      revalidateTag(tag);
    }

    if (path) {
      revalidatePath(path);
    }

    return NextResponse.json({
      revalidated: true,
      tag: tag || null,
      path: path || null,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { message: "Lỗi xử lý revalidation", error: err.message },
      { status: 500 }
    );
  }
}
