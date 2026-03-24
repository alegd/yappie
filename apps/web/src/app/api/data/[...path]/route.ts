import { API_URL } from "@/lib/constants/endpoints";
import { parseResponse } from "@/lib/response";
import { NextRequest, NextResponse } from "next/server";

type RequestOptions = {
  method: string;
  headers: Record<string, string>;
  body?: string | FormData;
};

export const runtime = "nodejs";

async function handler(req: NextRequest) {
  try {
    const headers: Record<string, string> = {};

    req.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "host") {
        headers[key] = value;
      }
    });

    const options: RequestOptions = {
      method: req.method ?? "GET",
      headers,
    };

    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      const contentType = req.headers.get("content-type") || "";

      if (contentType.includes("multipart/form-data")) {
        const formData = await req.formData();
        options.body = formData;
        delete headers["content-type"]; // ahora sí permitido
      } else {
        const text = await req.text();
        if (text) {
          options.body = text;
          headers["content-type"] = "application/json";
        }
      }
    }

    const apiRelativeUrl = req.url.substring(req.url.indexOf("/api/data")).replace("/api/data", "");
    const response = await fetch(`${API_URL}${apiRelativeUrl}`, options);

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error }, { status: response.status });
    }

    const data = await parseResponse(response);

    if (data) {
      return NextResponse.json(data, { status: response.status });
    }

    return new Response(null, { status: response.status });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: error.response?.data ?? error },
      { status: error.response?.status ?? 500 },
    );
  }
}

export { handler as DELETE, handler as GET, handler as PATCH, handler as POST, handler as PUT };
