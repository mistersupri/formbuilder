import { google } from "googleapis";
import { prisma } from "./prisma";

export async function getGoogleAccessToken(userId: string) {
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

export async function createGoogleSheetsIntegration(
  accessToken: string,
  title: string,
) {
  const oauth2Client = new google.auth.OAuth2();

  oauth2Client.setCredentials({
    access_token: accessToken,
  });

  const sheets = google.sheets({ version: "v4", auth: oauth2Client });

  // Create a new spreadsheet
  const spreadsheet = await sheets.spreadsheets.create({
    requestBody: {
      properties: {
        title: `Form Responses - ${title}`,
      },
    },
  });

  return {
    spreadsheetId: spreadsheet.data.spreadsheetId,
    sheetId: spreadsheet.data.sheets?.[0]?.properties?.sheetId || 0,
  };
}

export async function syncGoogleSheet(
  spreadsheetId: string,
  accessToken: string,
  headers: string[],
  rows: (string | number | boolean | null)[][],
) {
  if (!accessToken) {
    throw new Error("Access token missing");
  }

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken,
  });

  const sheets = google.sheets({ version: "v4", auth: oauth2Client });

  // 1. Ambil nama sheet
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets(properties(title))",
  });

  const sheetTitle =
    spreadsheet.data.sheets?.[0]?.properties?.title || "Sheet1";

  // 2. Gabungkan header + data
  const values = [headers, ...rows];

  // 3. Clear semua isi sheet
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${sheetTitle}`,
  });

  // 4. Tulis ulang semua data
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetTitle}!A1`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values,
    },
  });
}

export async function appendToGoogleSheet(
  spreadsheetId: string,
  accessToken: string,
  headers: string[],
  rows: (string | number | boolean | null)[][],
) {
  if (!accessToken) {
    throw new Error("Access token missing");
  }

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken,
  });

  const sheets = google.sheets({ version: "v4", auth: oauth2Client });

  // 1. Ambil nama sheet pertama
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets(properties(title))",
  });

  const sheetTitle =
    spreadsheet.data.sheets?.[0]?.properties?.title || "Sheet1";

  // 2. Ambil semua data (untuk hitung row terakhir)
  const existingData = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetTitle}`,
  });

  let existingValues = existingData.data.values ?? [];
  let rowCount = existingValues.length;

  // 3. Handle header
  let existingHeaders: string[] = existingValues[0] ?? [];

  const targetHeaders =
    existingHeaders.length === 0
      ? headers
      : Array.from(new Set([...existingHeaders, ...headers]));

  // 4. Kalau header belum ada / berubah → update header
  if (
    existingHeaders.length === 0 ||
    existingHeaders.length !== targetHeaders.length ||
    existingHeaders.some((h, i) => h !== targetHeaders[i])
  ) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetTitle}!A1`,
      valueInputOption: "RAW",
      requestBody: {
        values: [targetHeaders],
      },
    });

    existingHeaders = targetHeaders;

    if (rowCount === 0) {
      rowCount = 1; // header sudah dibuat
    }
  }

  // 5. Normalize rows sesuai header
  const normalizedRows = rows.map((row) => {
    const rowMap = new Map<string, string | number | boolean | null>();

    headers.forEach((header, index) => {
      rowMap.set(header, row[index] ?? "");
    });

    return targetHeaders.map((header) => rowMap.get(header) ?? "");
  });

  if (normalizedRows.length === 0) {
    return;
  }

  // 6. Tentukan start row (baris terakhir + 1)
  const startRow = rowCount + 1;
  const startRange = `${sheetTitle}!A${startRow}`;

  // 7. Insert data (tanpa overwrite)
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: startRange,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: normalizedRows,
    },
  });
}

export async function createFolderInGoogleDrive(
  userId: string,
  accessToken: string,
  folderName: string,
) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken,
  });

  const drive = google.drive({ version: "v3", auth: oauth2Client });

  const folder = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
    },
    fields: "id",
  });

  return folder.data.id;
}

export async function saveFileToGoogleDrive(
  accessToken: string,
  fileName: string,
  content: string,
  folderId?: string,
) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken,
  });

  const drive = google.drive({ version: "v3", auth: oauth2Client });

  const file = await drive.files.create({
    requestBody: {
      name: fileName,
      mimeType: "text/plain",
      parents: folderId ? [folderId] : undefined,
    },
    media: {
      mimeType: "text/plain",
      body: content,
    },
  });

  return file.data.id;
}
