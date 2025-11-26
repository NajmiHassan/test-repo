
import React, { useState, useCallback, useRef } from 'react';
import { extractTextFromImage, generateExpenseJson } from './services/geminiService';
import { saveToGoogleSheets } from './services/sheetsService';
import type { ExpenseData, ProcessedReceipt } from './types';
import { GoogleSheetsAuth } from './components/GoogleSheetsAuth';
import { ImageUploader } from './components/ImageUploader';
import { ResultsDashboard } from './components/ResultsDashboard';
import { LogoIcon, SparklesIcon, ArrowDownIcon } from './components/icons';

/**
 * Main application component.
 * Manages the entire workflow from uploading receipts to saving data in Google Sheets.
 */
export default function App(): React.ReactElement {
  const [googleAccessToken, setGoogleAccessToken] = useState<string>('');
  const [spreadsheetId, setSpreadsheetId] = useState<string>('');
  
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processedReceipts, setProcessedReceipts] = useState<ProcessedReceipt[]>([]);
  const appRef = useRef<HTMLDivElement>(null);

  const handleScrollToApp = () => {
    appRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  /**
   * Main handler to process all uploaded receipts.
   * This function orchestrates the calls to Gemini for OCR and data structuring,
   * and then to the Google Sheets API for saving the data.
   */
  const handleProcessReceipts = useCallback(async () => {
    if (imageFiles.length === 0 || !googleAccessToken || !spreadsheetId) {
      alert('Please upload images and connect to Google Sheets.');
      return;
    }

    setIsProcessing(true);
    setProcessedReceipts([]); // Clear previous results

    const results: ProcessedReceipt[] = [];

    for (const file of imageFiles) {
      const imagePreview = URL.createObjectURL(file);
      let currentStatus = 'Processing OCR...';
      let currentData: ExpenseData | null = null;
      let error: string | null = null;
      let saveStatus: 'pending' | 'success' | 'failed' = 'pending';

      const initialResult: ProcessedReceipt = {
        id: file.name + Date.now(),
        imagePreview,
        status: currentStatus,
        data: null,
        saveStatus: 'pending',
        error: null,
      };
      
      const updateResult = (update: Partial<ProcessedReceipt>) => {
        const index = results.findIndex(r => r.id === initialResult.id);
        if (index !== -1) {
          results[index] = { ...results[index], ...update };
          setProcessedReceipts([...results]);
        }
      };

      results.push(initialResult);
      setProcessedReceipts([...results]);
      
      try {
        const ocrText = await extractTextFromImage(file);
        if (!ocrText) {
          throw new Error('Could not extract any text. The image might be unclear.');
        }
        
        currentStatus = 'Structuring data...';
        updateResult({ status: currentStatus });

        const expenseData = await generateExpenseJson(ocrText);
        currentData = expenseData;
        currentStatus = 'Data extracted';
        updateResult({ status: currentStatus, data: currentData });

        currentStatus = 'Saving to Google Sheets...';
        updateResult({ status: currentStatus });

        await saveToGoogleSheets(expenseData, googleAccessToken, spreadsheetId);
        saveStatus = 'success';
        currentStatus = 'Saved successfully!';
        updateResult({ status: currentStatus, saveStatus: 'success' });

      } catch (e: any) {
        error = e.message || 'An unknown error occurred.';
        saveStatus = 'failed';
        updateResult({ status: 'Failed', error, saveStatus });
      }
    }

    setIsProcessing(false);
  }, [imageFiles, googleAccessToken, spreadsheetId]);

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800" style={{ fontFamily: "'Inter', sans-serif" }}>
       {/* Hero Section */}
       <div className="relative h-screen flex flex-col items-center justify-center text-center bg-gradient-to-br from-green-200 via-white to-emerald-100 overflow-hidden px-4">
          <div className="absolute top-0 left-0 -ml-40 -mt-40 w-96 h-96 bg-green-300 rounded-full opacity-30 animate-blob"></div>
          <div className="absolute bottom-0 right-0 -mr-40 -mb-40 w-96 h-96 bg-emerald-200 rounded-full opacity-30 animate-blob animation-delay-4000"></div>
          
          <div className="relative z-10">
            <div className="inline-flex justify-center items-center gap-3 mb-4">
              <LogoIcon />
              <h1 className="text-2xl font-bold text-slate-700">Receipt Parser Pro</h1>
            </div>
            <h2 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight">
              Effortless Expense Tracking.
            </h2>
            <p className="max-w-2xl mx-auto mt-6 text-lg text-slate-600">
              Stop typing out receipts. Let AI scan, structure, and save your expenses directly to Google Sheets in seconds.
            </p>
            <div className="mt-8">
              <button
                onClick={handleScrollToApp}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-green-600 text-white font-semibold rounded-lg shadow-lg hover:bg-green-700 disabled:bg-slate-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transform hover:scale-105"
              >
                Get Started <ArrowDownIcon />
              </button>
            </div>
          </div>
        </div>

      <main className="container mx-auto max-w-4xl p-4 md:py-16 md:px-8" ref={appRef}>
        <div className="bg-white p-6 md:p-10 rounded-2xl shadow-2xl shadow-slate-200/80">
          <header className="text-center mb-10">
            <h1 className="text-4xl font-bold text-slate-900">Let's Get Processing</h1>
            <p className="text-slate-600 mt-2">
              Connect to Google Sheets and start uploading.
            </p>
          </header>
          
          <div className="space-y-8">
            <GoogleSheetsAuth 
              onTokenReceived={setGoogleAccessToken}
              onSpreadsheetSelected={setSpreadsheetId}
              selectedSpreadsheetId={spreadsheetId}
            />
            
            <ImageUploader onFilesSelected={setImageFiles} disabled={isProcessing} />

            <div className="text-center pt-4">
              <button
                onClick={handleProcessReceipts}
                disabled={isProcessing || imageFiles.length === 0 || !googleAccessToken || !spreadsheetId}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-green-600 text-white font-semibold rounded-lg shadow-lg hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <SparklesIcon />
                    Process Receipts
                  </>
                )}
              </button>
            </div>
            
            {processedReceipts.length > 0 && (
              <ResultsDashboard processedReceipts={processedReceipts} />
            )}
          </div>
        </div>

        <footer className="text-center mt-12 text-sm text-slate-500">
            <p>Powered by Gemini and Google Sheets</p>
        </footer>
      </main>
    </div>
  );
}
