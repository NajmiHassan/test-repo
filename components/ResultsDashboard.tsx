
import React from 'react';
import type { ProcessedReceipt, ExpenseData } from '../types';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from './icons';

interface ResultsDashboardProps {
  processedReceipts: ProcessedReceipt[];
}

/**
 * A dashboard component to display the results for each processed receipt.
 * Shows the image, status, save status, and the extracted data table.
 */
export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ processedReceipts }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
      <div className="flex items-center mb-4">
        <div className="bg-green-100 text-green-600 rounded-full h-8 w-8 flex items-center justify-center font-bold text-lg mr-3">3</div>
        <h2 className="text-xl font-semibold text-slate-800">Processing Results</h2>
      </div>
      <div className="space-y-6">
        {processedReceipts.map((receipt) => (
          <ReceiptResultCard key={receipt.id} receipt={receipt} />
        ))}
      </div>
    </div>
  );
};

const ReceiptResultCard: React.FC<{ receipt: ProcessedReceipt }> = ({ receipt }) => {
  const getSaveStatusIcon = () => {
    switch (receipt.saveStatus) {
      case 'success':
        return <CheckCircleIcon className="text-green-500" />;
      case 'failed':
        return <XCircleIcon className="text-red-500" />;
      case 'pending':
        return <ClockIcon className="text-slate-400" />;
    }
  };

  return (
    <div className="border border-slate-200 rounded-lg p-4 transition-all duration-300">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-shrink-0">
          <img src={receipt.imagePreview} alt="Receipt preview" className="w-full md:w-32 h-32 object-cover rounded-md border" />
        </div>
        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium text-slate-600 truncate" title={receipt.id.split('.').slice(0,-1).join('.')}>Status: {receipt.status}</p>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold">Sheet:</span>
              <span className="flex items-center gap-1">
                {getSaveStatusIcon()}
                <span className="capitalize">{receipt.saveStatus}</span>
              </span>
            </div>
          </div>
          {receipt.error && (
            <div className="mt-2 bg-red-50 text-red-700 p-2 rounded-md text-sm border border-red-200">
              <strong>Error:</strong> {receipt.error}
            </div>
          )}
          {receipt.data && <ExpenseDataTable data={receipt.data} />}
        </div>
      </div>
    </div>
  );
};

const ExpenseDataTable: React.FC<{ data: ExpenseData }> = ({ data }) => {
  return (
    <div className="mt-4 overflow-x-auto">
      <div className="grid grid-cols-3 gap-2 text-sm mb-2 text-slate-600 font-semibold">
        <div>Merchant: <span className="font-normal">{data.merchant}</span></div>
        <div>Date: <span className="font-normal">{data.date}</span></div>
        <div>Total: <span className="font-normal text-green-700 font-bold">{data.total.toFixed(2)}</span></div>
      </div>
      <table className="min-w-full divide-y divide-slate-200 border rounded-md">
        <thead className="bg-slate-50">
          <tr>
            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Item</th>
            <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Qty</th>
            <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Price</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {data.items.map((item, index) => (
            <tr key={index}>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-800">{item.item}</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-600 text-right">{item.quantity}</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-600 text-right">{item.price.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
