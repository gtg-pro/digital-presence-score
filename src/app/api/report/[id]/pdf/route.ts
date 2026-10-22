import {
  handleExportGet,
  handleExportPost,
} from "@/lib/report/export/export-route";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return handleExportGet(id, "pdf");
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return handleExportPost(request, id, "pdf");
}
