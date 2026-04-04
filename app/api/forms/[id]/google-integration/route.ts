import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import {
  createGoogleSheetsIntegration,
  appendToGoogleSheet,
  createFolderInGoogleDrive,
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
  await appendToGoogleSheet(spredSheetId, accessToken, headers, rows);
}

async function getGoogleAccessToken(userId: string) {
  const googleAccount = await prisma.account.findFirst({
    where: {
      userId,
      provider: "google",
    },
    select: {
      provider: true,
      providerAccountId: true,
      access_token: true,
      refresh_token: true,
      expires_at: true,
    },
  });

  if (!googleAccount) {
    return null;
  }

  const isAccessTokenValid =
    googleAccount.access_token &&
    (!googleAccount.expires_at ||
      googleAccount.expires_at * 1000 > Date.now() + 60_000);

  if (isAccessTokenValid) {
    return googleAccount.access_token;
  }

  if (!googleAccount.refresh_token) {
    return googleAccount.access_token ?? null;
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: googleAccount.refresh_token,
    }),
  });

  if (!response.ok) {
    console.error(
      "Failed to refresh Google access token:",
      await response.text(),
    );
    return googleAccount.access_token ?? null;
  }

  const refreshedTokens = await response.json();
  const accessToken = refreshedTokens.access_token as string | undefined;

  if (!accessToken) {
    return googleAccount.access_token ?? null;
  }

  await prisma.account.update({
    where: {
      provider_providerAccountId: {
        provider: googleAccount.provider,
        providerAccountId: googleAccount.providerAccountId,
      },
    },
    data: {
      access_token: accessToken,
      expires_at: refreshedTokens.expires_in
        ? Math.floor(Date.now() / 1000 + refreshedTokens.expires_in)
        : googleAccount.expires_at,
      refresh_token:
        refreshedTokens.refresh_token ?? googleAccount.refresh_token,
    },
  });

  return accessToken;
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
