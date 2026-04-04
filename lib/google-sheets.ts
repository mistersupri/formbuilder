import { google } from "googleapis";

export async function createGoogleSheetsIntegration(
  userId: string,
  accessToken: string,
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
        title: `Form Responses - ${new Date().toISOString()}`,
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
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken,
  });

  const sheets = google.sheets({ version: "v4", auth: oauth2Client });

  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets(properties(title))",
  });

  const sheetTitle = spreadsheet.data.sheets?.[0]?.properties?.title || "Sheet1";
  const headerRange = `${sheetTitle}!1:1`;
  const dataRange = `${sheetTitle}!A2`;

  const headerRow = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: headerRange,
  });

  const existingHeaders = (headerRow.data.values?.[0] ?? []).map(String);
  const targetHeaders =
    existingHeaders.length === 0
      ? headers
      : Array.from(new Set([...existingHeaders, ...headers]));

  const normalizedRows = rows.map((row) => {
    const rowMap = new Map<string, string | number | boolean | null>();

    headers.forEach((header, index) => {
      rowMap.set(header, row[index] ?? "");
    });

    return targetHeaders.map((header) => rowMap.get(header) ?? "");
  });

  if (
    existingHeaders.length === 0 ||
    existingHeaders.length !== targetHeaders.length ||
    existingHeaders.some((header, index) => header !== targetHeaders[index])
  ) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetTitle}!A1`,
      valueInputOption: "RAW",
      requestBody: {
        values: [targetHeaders],
      },
    });
  }

  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: dataRange,
  });

  if (normalizedRows.length === 0) {
    return;
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: dataRange,
    valueInputOption: "RAW",
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
