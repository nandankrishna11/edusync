import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Loader } from '../../features/textbooks/components/Icons';
import Button from '../../components/ui/Button';
import TextbookUploadCard from '../../features/textbooks/components/TextbookUploadCard';
import UploadModal from '../../features/textbooks/components/UploadModal';
import { textbookService } from '../../features/textbooks/services/textbookService';

const TextbookLibraryPage = () => {
  const [textbooks, setTextbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTextbooks();
  }, []);

  const loadTextbooks = async () => {
    try {
      setLoading(true);
      const data = await textbookService.listTextbooks();
      setTextbooks(data);
    } catch (err) {
      setError('Failed to load textbooks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file, metadata) => {
    try {
      await textbookService.uploadTextbook(file, metadata);
      await loadTextbooks();
      setShowUploadModal(false);
    } catch (err) {
      throw err;
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this textbook?')) {
      return;
    }

    try {
      await textbookService.deleteTextbook(id);
      await loadTextbooks();
    } catch (err) {
      alert('Failed to delete textbook');
      console.error(err);
    }
  };

  const handleView = (id) => {
    const url = textbookService.getPdfUrl(id);
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Textbook Library</h1>
                <p className="text-gray-600 mt-1">Upload and manage course textbooks</p>
              </div>
            </div>
            <Button onClick={() => setShowUploadModal(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Upload New Textbook
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : textbooks.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No textbooks yet</h3>
            <p className="text-gray-600 mb-6">Upload your first textbook to get started</p>
            <Button onClick={() => setShowUploadModal(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Upload Textbook
            </Button>
          </div>
        ) : (
          /* Textbook List */
          <div className="space-y-4">
            {textbooks.map((textbook) => (
              <TextbookUploadCard
                key={textbook.id}
                textbook={textbook}
                onView={handleView}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUpload}
      />
    </div>
  );
};

export default TextbookLibraryPage;
