'use client';

import { useState } from 'react';

interface PDFUploadProps {
  onPDFUploaded: (file: File) => void;
}

export default function PDFUpload({ onPDFUploaded }: PDFUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        onPDFUploaded(file);
        alert('PDF uploaded! Please manually enter the values from the PDF using the form above.');
        setIsOpen(false);
      } else {
        alert('Please upload a PDF file');
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        onPDFUploaded(file);
        alert('PDF uploaded! Please manually enter the values from the PDF using the form above.');
        setIsOpen(false);
      } else {
        alert('Please upload a PDF file');
      }
    }
  };

  if (!isOpen) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-semibold"
        >
          📄 Upload Lab Report PDF
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-800">Upload Lab Report</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
        >
          ×
        </button>
      </div>

      <form
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className="space-y-4"
      >
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-300 hover:border-purple-400'
          }`}
        >
          <div className="space-y-4">
            <div className="text-6xl">📄</div>
            <div>
              <p className="text-lg font-medium text-gray-700 mb-2">
                Drag and drop your PDF here
              </p>
              <p className="text-sm text-gray-500">or</p>
            </div>
            <label className="cursor-pointer">
              <span className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-semibold inline-block">
                Browse Files
              </span>
              <input
                type="file"
                accept=".pdf"
                onChange={handleChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="font-semibold text-amber-800 mb-2">📌 How it works:</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-amber-700">
            <li>Upload your PDF lab report</li>
            <li>The PDF will be stored for your reference</li>
            <li>Use the manual entry form above to add specific values</li>
            <li>Charts will update automatically</li>
          </ol>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">💡 Future Enhancement:</h4>
          <p className="text-sm text-blue-700">
            Automatic PDF extraction is planned for a future update. For now, please manually
            enter the values from your uploaded PDFs.
          </p>
        </div>
      </form>
    </div>
  );
}
