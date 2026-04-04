import { google } from "googleapis";

export async function createGoogleSheetsIntegration(
  accessToken: string,
  title: string,
) {
  const oauth2Client = new google.auth.OAuth2();

  console.log(accessToken);
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
