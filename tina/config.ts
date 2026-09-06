import { defineConfig } from "tinacms";
import { sectionTemplates, heroFields, navLinkFields } from "./schema/shared";

const branch = process.env.TINA_BRANCH || "main";
const clientId = process.env.NEXT_PUBLIC_TINA_CLIENT_ID || "";
const token = process.env.TINA_TOKEN || "";

export default defineConfig({
  branch,
  clientId,
  token,
  build: {
    outputFolder: "admin",
    publicFolder: "public",
  },
  media: {
    tina: {
      mediaRoot: "uploads",
      publicFolder: "public",
    },
  },
  schema: {
    collections: [
      // ── Site settings ──────────────────────────────────────────────────────
      {
        name: "site",
        label: "Site Settings",
        path: "src/content",
        format: "json",
        match: { include: "site" },
        ui: {
          allowedActions: { create: false, delete: false },
          router: () => "/",
        },
        fields: [
          {
            type: "string",
            name: "title",
            label: "Site Title",
            required: true,
          },
          {
            type: "string",
            name: "description",
            label: "Site Description",
            ui: { component: "textarea" },
          },
          { type: "string", name: "siteUrl", label: "Production site URL", required: true, description: "HTTPS custom domain, without a trailing slash" },
          { type: "string", name: "socialImage", label: "Social share image", required: true, description: "Public path, e.g. /social-card.png (1200 × 630 recommended)" },
          { type: "string", name: "favicon", label: "Favicon", required: true, description: "Public path, e.g. /favicon.svg" },
          {
            type: "object", name: "localBusiness", label: "Local business structured data",
            fields: [
              { type: "boolean", name: "enabled", label: "Publish LocalBusiness schema" },
              { type: "string", name: "name", label: "Business name" },
              { type: "string", name: "telephone", label: "Telephone" },
              { type: "string", name: "email", label: "Email" },
              { type: "string", name: "streetAddress", label: "Street address" },
              { type: "string", name: "addressLocality", label: "City / locality" },
              { type: "string", name: "addressRegion", label: "State / region" },
              { type: "string", name: "postalCode", label: "Postal code" },
              { type: "string", name: "addressCountry", label: "Country code" },
            ],
          },
          {
            type: "object",
            name: "contact",
            label: "Contact info",
            fields: [
              { type: "string", name: "phone", label: "Phone" },
              { type: "string", name: "phoneUrl", label: "Phone URL (tel:...)" },
              { type: "string", name: "email", label: "Email" },
              { type: "string", name: "emailUrl", label: "Email URL (mailto:...)" },
              { type: "string", name: "address", label: "Address" },
            ],
          },
          {
            type: "object",
            name: "navigation",
            label: "Main navigation",
            list: true,
            fields: navLinkFields,
          },
          {
            type: "object",
            name: "actions",
            label: "Global action URLs",
            fields: [
              { type: "string", name: "donate", label: "Donate URL" },
              { type: "string", name: "newsletter", label: "Newsletter signup URL" },
            ],
          },
        ],
      },

      // ── Pages ──────────────────────────────────────────────────────────────
      {
        name: "page",
        label: "Pages",
        path: "src/content/pages",
        format: "json",
        ui: {
          filename: {
            readonly: false,
            slugify: (values: Record<string, unknown>) =>
              (values?.slug as string) ||
              (values?.title as string)?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") ||
              "page",
          },
          router: ({ document }: { document: Record<string, unknown> }) => {
            const slug = document.slug as string | undefined;
            return slug ? `/${slug}/` : undefined;
          },
        },
        fields: [
          {
            type: "string",
            name: "title",
            label: "Page title",
            isTitle: true,
            required: true,
          },
          {
            type: "string",
            name: "slug",
            label: "URL slug",
            required: true,
          },
          {
            type: "string",
            name: "description",
            label: "Meta description",
            ui: { component: "textarea" },
          },
          {
            type: "object",
            name: "hero",
            label: "Hero",
            fields: heroFields,
          },
          {
            type: "object",
            name: "sections",
            label: "Sections",
            list: true,
            templates: sectionTemplates,
          },
        ],
      },

      // ── Forms ──────────────────────────────────────────────────────────────
      {
        name: "form",
        label: "Forms",
        path: "src/content/forms",
        format: "json",
        ui: {
          router: ({ document }: { document: Record<string, unknown> }) => {
            const slug = document.slug as string | undefined;
            return slug ? `/forms/${slug}/` : undefined;
          },
        },
        fields: [
          {
            type: "string",
            name: "title",
            label: "Form title",
            isTitle: true,
            required: true,
          },
          {
            type: "string",
            name: "slug",
            label: "URL slug",
            required: true,
          },
          {
            type: "string",
            name: "description",
            label: "Form description",
            ui: { component: "textarea" },
          },
          {
            type: "string",
            name: "successMessage",
            label: "Success message",
            ui: { component: "textarea" },
            description: "Shown to the user after a successful submission",
          },
          {
            type: "string",
            name: "submitLabel",
            label: "Submit button label",
          },
          {
            type: "object",
            name: "fields",
            label: "Form fields",
            list: true,
            fields: [
              {
                type: "string",
                name: "name",
                label: "Field name (machine-readable, no spaces)",
                required: true,
              },
              {
                type: "string",
                name: "label",
                label: "Field label",
                required: true,
              },
              {
                type: "string",
                name: "type",
                label: "Field type",
                required: true,
                options: ["text", "email", "tel", "textarea", "select", "checkbox"],
                ui: { component: "select" },
              },
              {
                type: "boolean",
                name: "required",
                label: "Required",
              },
              {
                type: "string",
                name: "placeholder",
                label: "Placeholder",
              },
              {
                type: "string",
                name: "options",
                label: "Options (select only)",
                description: "Comma-separated list of options, e.g. 'Option A,Option B,Option C'",
                ui: { component: "textarea" },
              },
            ],
          },
        ],
      },
    ],
  },
});
