import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons';

interface ImageUploaderProps {
  onFilesSelected: (files: File[]) => void;
  disabled: boolean;
}

/**
 * A user-friendly component for uploading one or more image files.
 * Supports both drag-and-drop and traditional file selection.
 * Displays previews of the selected images.
 */
export const ImageUploader: React.FC<ImageUploaderProps> = ({ onFilesSelected, disabled }) => {
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = useCallback((files: FileList | null) => {
    if (files) {
      const fileArray = Array.from(files);
      onFilesSelected(fileArray);
      
      const newPreviews = fileArray.map(file => URL.createObjectURL(file));
      setPreviews(newPreviews);
    }
  }, [onFilesSelected]);
  
  const onDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled) {
      handleFileChange(e.dataTransfer.files);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
       <div className="flex items-center mb-4">
        <div className="bg-violet-100 text-violet-600 rounded-full h-8 w-8 flex items-center justify-center font-bold text-lg mr-3">2</div>
        <h2 className="text-xl font-semibold text-slate-800">Upload Receipts</h2>
      </div>

      <label
        htmlFor="file-upload"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`mt-1 flex justify-center rounded-lg border-2 border-dashed px-6 pt-5 pb-6 transition-colors duration-200 ${
          isDragging ? 'border-violet-500 bg-violet-50' : 'border-slate-300'
        } ${disabled ? 'bg-slate-100 cursor-not-allowed' : 'cursor-pointer hover:border-violet-400'}`}
      >
        <div className="space-y-1 text-center">
          <UploadIcon />
          <div className="flex text-sm text-slate-600">
            <span className="relative rounded-md bg-white font-medium text-violet-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-violet-500 focus-within:ring-offset-2 hover:text-violet-500">
              Upload files
            </span>
            <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple accept="image/*" onChange={(e) => handleFileChange(e.target.files)} disabled={disabled} />
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs text-slate-500">PNG, JPG, GIF up to 10MB</p>
        </div>
      </label>

      {previews.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-slate-700">Selected Receipts:</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-2">
            {previews.map((src, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                <img src={src} alt={`Preview ${index + 1}`} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
