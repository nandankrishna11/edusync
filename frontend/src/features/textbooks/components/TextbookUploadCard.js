import React from 'react';
import { FileText } from './Icons';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';

const TextbookUploadCard = ({ textbook, onView, onDelete }) => {
  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { variant: 'success', label: 'Indexed' },
      processing: { variant: 'warning', label: 'Processing' },
      pending: { variant: 'default', label: 'Pending' },
      failed: { variant: 'danger', label: 'Failed' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{textbook.title}</h3>
            <p className="text-sm text-gray-500 mt-1">
              {textbook.subject_code && `${textbook.subject_code} • `}
              Uploaded: {formatDate(textbook.upload_date)}
            </p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
              <span>Pages: {textbook.page_count || 0}</span>
              <span>•</span>
              <span>Size: {formatFileSize(textbook.file_size)}</span>
              <span>•</span>
              {getStatusBadge(textbook.processing_status)}
            </div>
          </div>
        </div>
        <div className="flex space-x-2 ml-4">
          <Button variant="ghost" size="sm" onClick={() => onView(textbook.id)}>
            View
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(textbook.id)}>
            Delete
          </Button>
        </div>
      </div>

      {textbook.processing_status === 'processing' && (
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Indexing progress</span>
            <span>{textbook.indexed_chunks} / {textbook.total_chunks} chunks</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{
                width: `${textbook.total_chunks > 0 ? (textbook.indexed_chunks / textbook.total_chunks) * 100 : 0}%`
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TextbookUploadCard;
