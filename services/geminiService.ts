
import { GoogleGenAI, Type } from "@google/genai";
import type { ExpenseData } from '../types';

// It is assumed that process.env.API_KEY is configured in the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

/**
 * Helper function to convert a File object to a GoogleGenerativeAI.Part object.
 * This involves reading the file as an ArrayBuffer and converting it to a base64 string.
 * @param file The image file to convert.
 * @returns A promise that resolves to the format required by the Gemini API.
 */
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        // The result includes the data URL prefix, which needs to be removed.
        // e.g., "data:image/jpeg;base64,..." -> "..."
        resolve(reader.result.split(',')[1]);
      } else {
        resolve('');
      }
    };
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type,
    },
  };
};

/**
 * Extracts text from an image file using the Gemini model.
 * @param imageFile The image file of the receipt.
 * @returns A promise that resolves to the extracted text as a string.
 */
export const extractTextFromImage = async (imageFile: File): Promise<string> => {
  const imagePart = await fileToGenerativePart(imageFile);
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        { text: "Extract all visible text from this receipt image. Preserve the layout and structure as much as possible." },
        imagePart,
      ],
    },
  });

  return response.text;
};

/**
 * Uses Gemini to convert raw OCR text into a structured JSON object.
 * It leverages the API's JSON mode with a defined schema for reliable output.
 * @param text The raw text extracted from the receipt.
 * @returns A promise that resolves to a structured ExpenseData object.
 */
export const generateExpenseJson = async (text: string): Promise<ExpenseData> => {
  const prompt = `
    Based on the following text extracted from a receipt, identify the merchant name, date, total amount, and list of items purchased.
    Each item should have a description, quantity, and price.
    If a value is not present, use a sensible default (e.g., quantity 1, empty string for merchant).
    Ensure the total is a number, removing any currency symbols.
    
    Receipt Text:
    ---
    ${text}
    ---
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          merchant: { type: Type.STRING, description: "The name of the store or merchant." },
          date: { type: Type.STRING, description: "The date of the transaction (e.g., YYYY-MM-DD)." },
          total: { type: Type.NUMBER, description: "The final total amount of the bill." },
          items: {
            type: Type.ARRAY,
            description: "A list of all items purchased.",
            items: {
              type: Type.OBJECT,
              properties: {
                item: { type: Type.STRING, description: "The name or description of the item." },
                quantity: { type: Type.INTEGER, description: "The quantity of the item purchased." },
                price: { type: Type.NUMBER, description: "The price of a single unit of the item." },
              },
              required: ["item", "quantity", "price"],
            },
          },
        },
        required: ["merchant", "date", "total", "items"],
      },
    },
  });

  try {
    const jsonStr = response.text.trim();
    // The response is expected to be a valid JSON string matching the schema.
    return JSON.parse(jsonStr) as ExpenseData;
  } catch (error) {
    console.error("Failed to parse JSON response from Gemini:", error);
    throw new Error("AI failed to generate a valid data structure. The receipt might be ambiguous.");
  }
};
