import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import TinaForm from "@/components/TinaForm";

const formsDir = path.join(process.cwd(), "src", "content", "forms");

function getForm(slug: string) {
  const filePath = path.join(formsDir, `${slug}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export async function generateStaticParams() {
  if (!fs.existsSync(formsDir)) return [];
  return fs
    .readdirSync(formsDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => ({ slug: f.replace(/\.json$/, "") }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const form = getForm(slug);
  if (!form) return {};
  return {
    title: form.title,
    description: form.description ?? undefined,
  };
}

export default async function FormPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const form = getForm(slug);

  if (!form) notFound();

  return (
    <main style={{ maxWidth: "640px", margin: "0 auto", padding: "2rem" }}>
      <h1>{form.title}</h1>
      {form.description && <p>{form.description}</p>}
      <TinaForm form={form} />
    </main>
  );
}
