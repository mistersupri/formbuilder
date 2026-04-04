import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const searchParams = request.nextUrl.searchParams;
    const formId = searchParams.get("formId");
    const origin = request.headers.get("origin") || "";

    if (!formId) {
      return NextResponse.json(
        { error: "formId is required" },
        { status: 400 },
      );
    }

    const form = await prisma.form.findUnique({
      where: { id: formId },
    });

    const domainWhitelist = await prisma.domainWhitelist.findMany({
      where: { userId: session?.user?.id || "" },
    });

    if (!form || !form.isPublished) {
      return NextResponse.json(
        { error: "Form not found or not published" },
        { status: 404 },
      );
    }

    // Check domain whitelist
    if (domainWhitelist && domainWhitelist.length > 0) {
      const isAllowed = domainWhitelist.some((item) => {
        return origin.includes(item.domain) || origin.endsWith(item.domain);
      });

      if (!isAllowed) {
        return NextResponse.json(
          { error: "Domain not whitelisted" },
          { status: 403 },
        );
      }
    }

    // Return embed script
    const embedScript = `
(function() {
  const formId = '${formId}';
  const container = document.currentScript.parentElement;
  const iframe = document.createElement('iframe');
  
  iframe.src = '${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/form/${form.slug}?embedded=true';
  iframe.style.cssText = 'width: 100%; height: 600px; border: none; border-radius: 8px;';
  iframe.title = '${form.title}';
  
  container.appendChild(iframe);
})();
    `;

    return new NextResponse(embedScript, {
      headers: {
        "Content-Type": "application/javascript",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error generating embed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { formId, domain } = body;

    if (!formId || !domain) {
      return NextResponse.json(
        { error: "formId and domain are required" },
        { status: 400 },
      );
    }

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const form = await prisma.form.findUnique({
      where: { id: formId },
    });
    const domainWhitelist = await prisma.domainWhitelist.findMany({
      where: { userId: session.user.id },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Add domain to whitelist
    const whitelist = domainWhitelist.map((item) => item.domain) || [];

    if (!whitelist.includes(domain)) {
      const updated = await prisma.user.update({
        where: { id: session.user.id },
        data: {
          domainWhitelists: {
            create: {
              domain,
              isActive: true,
            },
          },
        },
        select: { domainWhitelists: true },
      });

      return NextResponse.json({
        success: true,
        whitelist: updated.domainWhitelists,
      });
    }
  } catch (error) {
    console.error("Error updating whitelist:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
