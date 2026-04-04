import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import {
  createGoogleSheetsIntegration,
  syncGoogleSheet,
  createFolderInGoogleDrive,
  getGoogleAccessToken,
} from "@/lib/google-sheets";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const setupGoogleSchema = z.object({
  setupSheets: z.boolean().optional().default(true),
  setupDrive: z.boolean().optional().default(true),
});

async function syncFormResponsesToGoogleSheets(
  spredSheetId: string,
  id: string,
  userId: string,
  form: any,
) {
  // Fetch all responses for this form
  const responses = await prisma.response.findMany({
    where: { formId: id },
    orderBy: { createdAt: "asc" },
  });

  if (responses.length === 0) {
    return NextResponse.json({ success: true, count: 0 });
  }

  const accessToken = await getGoogleAccessToken(userId);

  if (!accessToken) {
    return NextResponse.json(
      { error: "Google account not connected" },
      { status: 400 },
    );
  }

  // Prepare headers from form fields
  const headers = form.fields?.map((f: any) => f.label);

  // Prepare rows from responses
  const rows = responses.map((response: any) => {
    return form.fields.map((field: any) => {
      const value = response.data[field.id];
      if (Array.isArray(value)) {
        return value.join(", ");
      }
      return value || "";
    });
  });

  console.log("Syncing to Google Sheets with headers:", headers);
  console.log("Rows:", rows);

  // Append to Google Sheets
  await syncGoogleSheet(spredSheetId, accessToken, headers, rows);
}

export async function POST(
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

    const body = await request.json();
    const validatedData = setupGoogleSchema.parse(body);
    const accessToken = await getGoogleAccessToken(session.user.id);

    if (!accessToken) {
      return NextResponse.json(
        { error: "Google account not connected" },
        { status: 400 },
      );
    }

    let googleSheetId: string | null | undefined = form.googleSheetId;
    // let googleDriveFolderId: string | null | undefined =
    //   form.googleDriveFolderId;

    // Create Google Sheets
    if (validatedData.setupSheets) {
      const sheetsResult = await createGoogleSheetsIntegration(
        accessToken,
        form.title,
      );
      googleSheetId = sheetsResult.spreadsheetId;
    }

    // Create Google Drive folder
    // if (validatedData.setupDrive) {
    //   googleDriveFolderId = await createFolderInGoogleDrive(
    //     session.user.id,
    //     accessToken,
    //     `Form - ${form.title}`,
    //   );
    // }

    // Store Google integration info
    await prisma.form.update({
      where: { id },
      data: {
        googleSheetId: googleSheetId,
        // googleDriveFolderId: googleDriveFolderId,
      },
    });

    await syncFormResponsesToGoogleSheets(
      googleSheetId!,
      id,
      session.user.id,
      form,
    ).catch((error) => {
      console.error("Error syncing responses to Google Sheets:", error);
    });

    return NextResponse.json({
      success: true,
      googleSheetId,
      // googleDriveFolderId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Error setting up Google integration:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Sync responses to Google Sheets
export async function PUT(
  _request: NextRequest,
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

    if (!form.googleSheetId) {
      return NextResponse.json(
        { error: "Google Sheets not configured" },
        { status: 400 },
      );
    }

    // Fetch all responses for this form
    const responses = await prisma.response.findMany({
      where: { formId: id },
      orderBy: { createdAt: "asc" },
    });

    if (responses.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    const accessToken = await getGoogleAccessToken(session.user.id);

    if (!accessToken) {
      return NextResponse.json(
        { error: "Google account not connected" },
        { status: 400 },
      );
    }

    await syncFormResponsesToGoogleSheets(
      form.googleSheetId!,
      id,
      session.user.id,
      form,
    );

    return NextResponse.json({
      success: true,
      count: responses.length,
    });
  } catch (error) {
    console.error("Error syncing to Google Sheets:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
