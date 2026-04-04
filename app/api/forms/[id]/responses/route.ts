import { authOptions } from "@/lib/auth";
import { appendToGoogleSheet, getGoogleAccessToken } from "@/lib/google-sheets";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const form = await prisma.form.findUnique({
      where: { id },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Get all responses for this form
    const responses = await prisma.response.findMany({
      where: { formId: id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        data: true,
        createdAt: true,
      },
    });

    return NextResponse.json(responses);
  } catch (error) {
    console.error("Error fetching responses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    const body = await request.json();

    // Verify form exists and is published
    const form = await prisma.form.findUnique({
      where: { id },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    if (!form.isPublished) {
      return NextResponse.json(
        { error: "Form is not published" },
        { status: 403 },
      );
    }

    // Create response
    const response = await prisma.response.create({
      data: {
        formId: id,
        data: body,
      },
    });

    if (form.googleSheetId) {
      const accessToken = await getGoogleAccessToken(session.user.id);

      if (!accessToken) {
        return NextResponse.json({ error: "Google account not connected" });
      }

      if (form.googleSheetId) {
        // Sync response to Google Sheets
        await appendToGoogleSheet(
          form.googleSheetId,
          accessToken,
          form.fields.map((field: any) => field?.label || ""),
          [
            Object.values(body).map((row) => {
              if (Array.isArray(row)) {
                return row.join(", ");
              }
              if (
                typeof row === "string" ||
                typeof row === "number" ||
                typeof row === "boolean" ||
                row === null
              ) {
                return row;
              }
              return String(row);
            }) as (string | number | boolean | null)[],
          ],
        );
      }
    }

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Error creating response:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
