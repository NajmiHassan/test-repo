
import React, { useState, useEffect, useRef } from 'react';
import { SheetIcon } from './icons';
import { createExpenseSheet, getSpreadsheets, getUserInfo } from '../services/sheetsService';
import type { GoogleUserInfo, SpreadsheetFile } from '../types';

interface GoogleSheetsAuthProps {
  onTokenReceived: (token: string) => void;
  onSpreadsheetSelected: (id: string) => void;
  selectedSpreadsheetId: string;
}

// Declare google global for TypeScript
declare global {
  interface Window {
    google: any;
  }
}

export const GoogleSheetsAuth: React.FC<GoogleSheetsAuthProps> = ({
  onTokenReceived,
  onSpreadsheetSelected,
  selectedSpreadsheetId,
}) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<GoogleUserInfo | null>(null);
  const [spreadsheets, setSpreadsheets] = useState<SpreadsheetFile[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  
  // Use a ref to store the token client so we can trigger it programmatically
  const tokenClient = useRef<any>(null);

  // You must set VITE_GOOGLE_CLIENT_ID in your .env file
  // Example: VITE_GOOGLE_CLIENT_ID=123456789-abc...apps.googleusercontent.com
  const googleClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    // If no client ID is provided, do not attempt to initialize the token client
    if (!googleClientId) return;

    // Initialize Google Identity Services Token Client
    if (window.google) {
      try {
        tokenClient.current = window.google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          // Scopes for Sheets (read/write), Drive (file creation), and User Info
          scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
          callback: async (tokenResponse: any) => {
            if (tokenResponse && tokenResponse.access_token) {
              const token = tokenResponse.access_token;
              setAccessToken(token);
              onTokenReceived(token);
              
              // Load user info and sheets
              try {
                const userInfo = await getUserInfo(token);
                setUser(userInfo);
                
                const sheets = await getSpreadsheets(token);
                setSpreadsheets(sheets);
                
                // Auto-select if a sheet named "Expenses" exists, otherwise prompt user
                if (sheets.length > 0 && !selectedSpreadsheetId) {
                  const defaultSheet = sheets.find(s => s.name.includes('Expenses'));
                  if (defaultSheet) {
                      onSpreadsheetSelected(defaultSheet.id);
                  }
                }
              } catch (error) {
                console.error("Error loading user data", error);
              }
            }
          },
        });
      } catch (error) {
        console.error("Error initializing Google Token Client:", error);
      }
    }
  }, [onTokenReceived, onSpreadsheetSelected, selectedSpreadsheetId, googleClientId]);

  const handleLogin = () => {
    if (tokenClient.current) {
      // Request access token (trigger popup)
      tokenClient.current.requestAccessToken();
    } else {
      if (!googleClientId) {
        alert("Configuration Error: Missing Google Client ID in .env file.");
      } else {
        alert("Google Identity Services not loaded yet. Please refresh the page.");
      }
    }
  };

  const handleCreateSheet = async () => {
    if (!accessToken) return;
    setIsCreating(true);
    try {
      const newSheet = await createExpenseSheet(accessToken);
      setSpreadsheets([newSheet, ...spreadsheets]);
      onSpreadsheetSelected(newSheet.id);
      alert(`Created new sheet: ${newSheet.name}`);
    } catch (e) {
      alert("Failed to create spreadsheet.");
      console.error(e);
    } finally {
      setIsCreating(false);
    }
  };

  if (!accessToken) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
        <div className="flex items-center mb-4">
          <div className="bg-green-100 text-green-700 rounded-full h-8 w-8 flex items-center justify-center font-bold text-lg mr-3">1</div>
          <h2 className="text-xl font-semibold text-slate-800">Connect to Google Sheets</h2>
        </div>
        <p className="text-slate-600 mb-6">
          Connect your Google account to automatically save receipts to a spreadsheet.
        </p>
        {!googleClientId ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200 text-sm">
                <strong>Setup Required:</strong> Missing <code>VITE_GOOGLE_CLIENT_ID</code> in .env file.
                <br/>
                <span className="text-xs mt-1 block">Create a .env file in the project root with your Google Client ID.</span>
            </div>
        ) : (
            <button
            onClick={handleLogin}
            className="flex items-center justify-center gap-3 w-full sm:w-auto px-6 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-all duration-200 shadow-sm"
            >
            <img src="https://www.gstatic.com/images/branding/product/1x/sheets_2020q4_48dp.png" alt="Sheets" className="w-6 h-6" />
            Sign in with Google
            </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 border-l-4 border-l-green-500">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
            <div className="bg-green-100 text-green-700 rounded-full h-8 w-8 flex items-center justify-center font-bold text-lg mr-3">1</div>
            <h2 className="text-xl font-semibold text-slate-800">Destination</h2>
        </div>
        {user && (
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full text-xs font-medium text-slate-600">
                {user.picture && <img src={user.picture} alt="" className="w-6 h-6 rounded-full"/>}
                <span className="truncate max-w-[150px]">{user.email}</span>
            </div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Select Spreadsheet
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <SheetIcon />
              </div>
              <select
                value={selectedSpreadsheetId}
                onChange={(e) => {
                    if (e.target.value === 'NEW') {
                        handleCreateSheet();
                    } else {
                        onSpreadsheetSelected(e.target.value);
                    }
                }}
                disabled={isCreating}
                className="block w-full rounded-md border-slate-300 shadow-sm pl-10 focus:border-green-500 focus:ring-green-500 sm:text-sm h-10"
              >
                <option value="" disabled>-- Select a Spreadsheet --</option>
                {spreadsheets.map(sheet => (
                  <option key={sheet.id} value={sheet.id}>{sheet.name}</option>
                ))}
                <option value="NEW" className="font-bold text-green-600">+ Create New "Expenses" Sheet</option>
              </select>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Select an existing sheet or create a new one. Data will be appended to the first tab.
          </p>
        </div>
      </div>
    </div>
  );
};
