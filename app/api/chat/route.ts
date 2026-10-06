import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, history } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Vui lòng nhập nội dung tin nhắn hợp lệ." },
        { status: 400 }
      );
    }

    const backendUrl =
      process.env.INTERNAL_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://127.0.0.1:8000";

    const apiRes = await fetch(`${backendUrl}/api/v1/candidates/career-chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message.trim(),
        history: history || [],
      }),
      // Cache-control no-store for real-time chat
      cache: "no-store",
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text().catch(() => "");
      console.error("[Chat Route Handler] Backend error:", apiRes.status, errText);
      return NextResponse.json(
        {
          reply:
            "Xin lỗi bạn, hệ thống AI đang quá tải trong giây lát. Bạn có thể xem trực tiếp danh sách vị trí trên Cổng Tuyển Dụng hoặc nộp CV qua tính năng Quick Apply nhé!",
          recommended_jobs: [],
        },
        { status: 200 }
      );
    }

    const data = await apiRes.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Chat Route Handler] Connection error:", error);
    return NextResponse.json(
      {
        reply:
          "Hệ thống đang kết nối lại với máy chủ tuyển dụng. Bạn vui lòng thử lại sau vài giây hoặc tra cứu thông tin trực tiếp trên Cổng Tuyển Dụng nhé!",
        recommended_jobs: [],
      },
      { status: 200 }
    );
  }
}
