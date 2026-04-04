import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const form = await prisma.form.findUnique({
      where: { id },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    if (form.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get responses count
    const totalResponses = await prisma.response.count({
      where: { formId: id },
    });

    // Get responses by date
    const responsesByDate = await prisma.response.findMany({
      where: { formId: id },
      select: {
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Group by date
    const responsesPerDay: Record<string, number> = {};
    responsesByDate.forEach((response) => {
      const date = new Date(response.createdAt).toISOString().split("T")[0];
      responsesPerDay[date] = (responsesPerDay[date] || 0) + 1;
    });

    // Calculate field completion rates
    const fieldStats: Record<string, { filled: number; empty: number }> = {};
    form.fields.forEach((field: any) => {
      fieldStats[field.id] = { filled: 0, empty: 0 };
    });

    responsesByDate.forEach((response: any) => {
      form.fields.forEach((field: any) => {
        const value = response.data?.[field.id];
        if (value) {
          fieldStats[field.id].filled++;
        } else {
          fieldStats[field.id].empty++;
        }
      });
    });

    return NextResponse.json({
      totalResponses,
      published: form.isPublished,
      createdAt: form.createdAt,
      updatedAt: form.updatedAt,
      responsesPerDay,
      fieldStats,
      completionRate:
        totalResponses > 0
          ? (
              form.fields?.reduce(
                (sum: number, field: any) => sum + fieldStats[field.id].filled,
                0,
              ) /
              (totalResponses * form.fields.length)
            ).toFixed(2)
          : 0,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
