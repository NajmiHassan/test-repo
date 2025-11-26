
/**
 * Represents a single item on an expense receipt.
 */
export interface ExpenseItem {
  item: string;
  quantity: number;
  price: number;
}

/**
 * Represents the fully structured data extracted from a receipt.
 */
export interface ExpenseData {
  merchant: string;
  date: string;
  total: number;
  items: ExpenseItem[];
}

/**
 * Represents the state of a single uploaded receipt throughout the processing workflow.
 */
export interface ProcessedReceipt {
  id: string; // Unique identifier for the receipt job
  imagePreview: string; // URL for the image preview
  status: string; // User-facing status message
  data: ExpenseData | null; // The structured data, once extracted
  saveStatus: 'pending' | 'success' | 'failed'; // Status of the save operation (Google Sheets)
  error: string | null; // Any error message encountered
}

/**
 * Google User Info
 */
export interface GoogleUserInfo {
  email: string;
  name: string;
  picture: string;
}

/**
 * Represents a Spreadsheet file from Drive
 */
export interface SpreadsheetFile {
  id: string;
  name: string;
}
