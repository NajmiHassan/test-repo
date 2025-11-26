import React from 'react';
import { InfoIcon, KeyIcon, DatabaseIcon } from './icons';

interface NotionCredentialsProps {
  notionApiKey: string;
  setNotionApiKey: (key: string) => void;
  notionDbId: string;
  setNotionDbId: (id: string) => void;
}

/**
 * A component for capturing the user's Notion API Key and Database ID.
 * It provides input fields and helpful links for the user to find these values.
 */
export const NotionCredentials: React.FC<NotionCredentialsProps> = ({
  notionApiKey,
  setNotionApiKey,
  notionDbId,
  setNotionDbId,
}) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
      <div className="flex items-center mb-4">
        <div className="bg-violet-100 text-violet-600 rounded-full h-8 w-8 flex items-center justify-center font-bold text-lg mr-3">1</div>
        <h2 className="text-xl font-semibold text-slate-800">Configure Notion</h2>
      </div>
      
      <div className="bg-violet-50 border-l-4 border-violet-400 text-violet-800 p-4 rounded-md mb-6" role="alert">
        <div className="flex">
          <InfoIcon />
          <div>
            <p className="font-bold">First time setup?</p>
            <p className="text-sm">You need a Notion integration token and a database ID. 
              <a href="https://developers.notion.com/docs/create-a-notion-integration" target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-violet-600 ml-1">
                 Learn how to get your token
              </a> and 
              <a href="https://developers.notion.com/docs/working-with-databases#retrieve-a-database" target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-violet-600 ml-1">
                 find your database ID.
              </a>
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="notion-api-key" className="block text-sm font-medium text-slate-700 mb-1">
            Notion API Key
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <KeyIcon />
            </div>
            <input
              type="password"
              id="notion-api-key"
              value={notionApiKey}
              onChange={(e) => setNotionApiKey(e.target.value)}
              placeholder="secret_..."
              className="block w-full rounded-md border-slate-300 shadow-sm pl-10 focus:border-violet-500 focus:ring-violet-500 sm:text-sm h-10"
            />
          </div>
        </div>
        <div>
          <label htmlFor="notion-db-id" className="block text-sm font-medium text-slate-700 mb-1">
            Notion Database ID
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
             <DatabaseIcon />
            </div>
            <input
              type="text"
              id="notion-db-id"
              value={notionDbId}
              onChange={(e) => setNotionDbId(e.target.value)}
              placeholder="a1b2c3d4e5f6..."
              className="block w-full rounded-md border-slate-300 shadow-sm pl-10 focus:border-violet-500 focus:ring-violet-500 sm:text-sm h-10"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
