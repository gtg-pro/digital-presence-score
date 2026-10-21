import { exportReportById } from "@/lib/report/export/report-export";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const result = await exportReportById(id, "png");

  if (!result.ok) {
    return Response.json(
      { error: result.code, message: result.message },
      {
        status: result.httpStatus,
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  }

  return new Response(new Uint8Array(result.bytes), {
    status: 200,
    headers: {
      "Content-Type": result.contentType,
      "Content-Disposition": `attachment; filename="${result.filename}"`,
      "Cache-Control": "private, no-store",
      "X-Report-Demo": result.isDemo ? "1" : "0",
    },
  });
}
