import React from 'react';
import { BookOpen, FileText, ExternalLink } from './Icons';
import Badge from '../../../components/ui/Badge';

const SourceCard = ({ source, index, onOpenPDF }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">
              {source.textbook_title || `Textbook ${source.textbook_id}`}
            </h4>
            <div className="flex items-center space-x-3 mt-1 text-sm text-gray-500">
              <span>Page {source.page}</span>
              <span>•</span>
              <div className="flex items-center space-x-1">
                <span>Relevance:</span>
                <span className="font-medium text-green-600">{source.relevance}%</span>
              </div>
            </div>
          </div>
        </div>
        <Badge variant="success" size="sm">Source {index}</Badge>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <p className="text-gray-700 leading-relaxed text-sm">
          "{source.excerpt}"
        </p>
      </div>

      <button
        onClick={() => onOpenPDF(source.textbook_id, source.page)}
        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
      >
        <FileText className="w-4 h-4" />
        <span>Open PDF at Page {source.page}</span>
        <ExternalLink className="w-4 h-4" />
      </button>
    </div>
  );
};

export default SourceCard;
