import type { ExpenseData } from '../types';

const NOTION_API_VERSION = '2022-06-28';
// Using a CORS proxy to bypass browser security restrictions for this client-side only app.
// In a production environment, this request should be handled by a backend server.
const NOTION_API_URL = 'https://corsproxy.io/?https://api.notion.com/v1/pages';


/**
 * Saves the extracted expense data to a Notion database.
 * This function constructs the request body according to the Notion API specification.
 * It now assumes a Notion database with the following properties:
 * - 'Name' (Title) <- The database's main title property.
 * - 'Merchant' (Text) <- A standard text property for the merchant name.
 * - 'Date' (Date)
 * - 'Total' (Number)
 * - 'Items' (Text)
 * 
 * @param expenseData The structured expense data to save.
 * @param apiKey The user's Notion integration token.
 * @param databaseId The ID of the target Notion database.
 * @throws Will throw an error if the API call fails.
 */
export const saveToNotion = async (
  expenseData: ExpenseData,
  apiKey: string,
  databaseId: string
): Promise<void> => {
  const { merchant, date, total, items } = expenseData;

  // Convert the items array into a simple string for the Notion rich text field.
  const itemsText = items
    .map(item => `- ${item.item} (Qty: ${item.quantity}, Price: ${item.price.toFixed(2)})`)
    .join('\n'); // Use standard newline, which will be properly encoded in JSON.

  const requestBody = {
    parent: { database_id: databaseId },
    properties: {
      // A Notion page requires a "Title" property. We assume the default "Name"
      // column exists and create a descriptive title from the merchant and date.
      Name: {
        title: [
          {
            text: {
              content: `${merchant || 'Expense'} on ${date || 'Unknown Date'}`,
            },
          },
        ],
      },
      // The error "Merchant is expected to be rich_text" indicates the user's "Merchant"
      // column is of type "Text". In the API, this corresponds to a "rich_text" property.
      Merchant: {
        rich_text: [
          {
            text: {
              content: merchant || 'Unknown Merchant',
            },
          },
        ],
      },
      // Assumes a "Date" property
      Date: {
        date: {
          start: date, // Assumes date is in a format Notion accepts (YYYY-MM-DD)
        },
      },
      // Assumes a "Number" property named "Total"
      Total: {
        number: total,
      },
      // Assumes a "Rich Text" property named "Items"
      Items: {
        rich_text: [
          {
            text: {
              content: itemsText.substring(0, 2000), // Rich text content is limited to 2000 characters
            },
          },
        ],
      },
    },
  };

  const response = await fetch(NOTION_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Notion-Version': NOTION_API_VERSION,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    let errorMessage = 'An unknown error occurred while contacting the Notion API.';
    try {
      // Try to parse the error response as JSON, which is what Notion usually returns.
      const errorData = await response.json();
      console.error('Notion API Error:', errorData);
      // Use the message from the Notion API error object if available, otherwise stringify the whole object.
      errorMessage = errorData.message || JSON.stringify(errorData);
    } catch (e) {
      // If the response isn't valid JSON, it might be a proxy error or network issue.
      // In that case, use the response text as the error message.
      errorMessage = await response.text();
    }
    throw new Error(`Failed to save to Notion: ${errorMessage}`);
  }
};