// 📁 components/PatentViewer.js
'use client'

import React from 'react';
import { Download, Eye, Edit } from 'lucide-react';

export default function PatentViewer({ patentData, onDownload, onEdit }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">Patent Document</h3>
        <div className="flex gap-2">
          <button
            onClick={onDownload}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
        </div>
      </div>
      
      <div className="border rounded-lg p-4 max-h-96 overflow-y-auto bg-gray-50">
        <pre className="whitespace-pre-wrap text-sm font-mono text-gray-800">
          {patentData}
        </pre>
      </div>
    </div>
  );
}
