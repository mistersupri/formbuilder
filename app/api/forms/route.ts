import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const createFormSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional().default(""),
});

async function getAuthenticatedUserId() {
  const session = await getServerSession(authOptions);

  if (session?.user?.id) {
    return session.user.id;
  }

  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  return user?.id ?? null;
}

function createBaseSlug(title: string) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);

  return slug || "form";
}

// GET /api/forms - Get all forms for authenticated user
export async function GET(_request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const forms = await prisma.form.findMany({
      where: { userId },
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
    console.error("Error fetching forms:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/forms - Create a new form
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createFormSchema.parse(body);

    // Generate unique slug
    const baseSlug = createBaseSlug(validatedData.title);

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
        userId,
        fields: [] as Prisma.InputJsonValue[],
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
    console.error("Error creating form:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
