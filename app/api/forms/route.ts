import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createFormSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional().default(""),
});

// GET /api/forms - Get all forms for authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const forms = await prisma.form.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        title: true,
        description: true,
        slug: true,
        isPublished: true,
        createdAt: true,
        _count: {
          select: { responses: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(forms);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/forms - Create a new form
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createFormSchema.parse(body);

    // Generate unique slug
    const baseSlug = validatedData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50);

    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const existing = await prisma.form.findUnique({
        where: { slug },
      });
      if (!existing) break;
      slug = `${baseSlug}-${counter++}`;
    }

    const form = await prisma.form.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        slug,
        userId: session.user.id || session.user.email,
        fields: [],
      },
    });

    return NextResponse.json(form, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
