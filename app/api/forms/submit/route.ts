import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { formSlug, data } = body as {
      formSlug?: string;
      data?: Record<string, unknown>;
    };

    if (!formSlug || !data) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Log submission — replace this block with your preferred delivery:
    //   Email:    SendGrid, Mailgun, Resend, EmailJS
    //   Storage:  your own database / Supabase / PlanetScale
    //   SaaS:     Formspree (https://formspree.io), Basin, etc.
    console.log(`[form submission] slug=${formSlug}`, data);

    return NextResponse.json(
      { success: true, message: "Form submitted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[form submission error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
