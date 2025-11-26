
import type { ExpenseData, SpreadsheetFile, GoogleUserInfo } from '../types';

/**
 * Appends expense data to a Google Sheet.
 * @param expenseData The extracted receipt data.
 * @param accessToken The OAuth access token.
 * @param spreadsheetId The ID of the spreadsheet to write to.
 */
export const saveToGoogleSheets = async (
  expenseData: ExpenseData,
  accessToken: string,
  spreadsheetId: string
): Promise<void> => {
  const { merchant, date, total, items } = expenseData;

  // Format items as a single string
  const itemsText = items
    .map(item => `${item.item} (${item.quantity}x ${item.price.toFixed(2)})`)
    .join(', ');

  // Row data: Date, Merchant, Total, Items
  const values = [
    [
      date || new Date().toISOString().split('T')[0],
      merchant || 'Unknown',
      total,
      itemsText
    ]
  ];

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:append?valueInputOption=USER_ENTERED`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to save to Google Sheets');
  }
};

/**
 * Creates a new Google Spreadsheet specifically for expenses.
 * @param accessToken The OAuth access token.
 * @returns The ID and Name of the created spreadsheet.
 */
export const createExpenseSheet = async (accessToken: string): Promise<SpreadsheetFile> => {
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: 'My Expenses (Receipt Parser)',
      },
      sheets: [
        {
          properties: {
            title: 'Expenses',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
          data: [
            {
              rowData: [
                {
                  values: [
                    { userEnteredValue: { stringValue: 'Date' } },
                    { userEnteredValue: { stringValue: 'Merchant' } },
                    { userEnteredValue: { stringValue: 'Total' } },
                    { userEnteredValue: { stringValue: 'Items' } },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create new spreadsheet');
  }

  const data = await response.json();
  return { id: data.spreadsheetId, name: data.properties.title };
};

/**
 * Fetches the list of spreadsheets accessible by the user.
 * @param accessToken The OAuth access token.
 */
export const getSpreadsheets = async (accessToken: string): Promise<SpreadsheetFile[]> => {
  // Query for spreadsheets, not trashed, ordering by modified time
  const query = "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false";
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&orderBy=modifiedTime desc&pageSize=20`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to list spreadsheets');
  }

  const data = await response.json();
  return (data.files || []).map((f: any) => ({ id: f.id, name: f.name }));
};

/**
 * Fetches basic user profile info using the access token.
 */
export const getUserInfo = async (accessToken: string): Promise<GoogleUserInfo> => {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
     throw new Error('Failed to get user info');
  }
  return await response.json();
};
