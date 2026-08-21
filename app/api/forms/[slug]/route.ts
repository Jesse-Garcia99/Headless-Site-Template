import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-static";

export async function generateStaticParams() {
  const formsDir = path.join(process.cwd(), "src", "content", "forms");
  if (!fs.existsSync(formsDir)) return [];
  return fs
    .readdirSync(formsDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => ({ slug: f.replace(/\.json$/, "") }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const formsDir = path.join(process.cwd(), "src", "content", "forms");
  const filePath = path.join(formsDir, `${slug}.json`);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  const formData = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return NextResponse.json(formData);
}
