import React, { useState, useRef } from 'react';
import { X, Upload, FileText } from './Icons';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

const UploadModal = ({ isOpen, onClose, onUpload }) => {
  const [title, setTitle] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [departmentCode, setDepartmentCode] = useState('');
  const [semester, setSemester] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Only PDF files are allowed');
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        setError('File size must be less than 100MB');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Only PDF files are allowed');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile || !title) {
      setError('Please provide a title and select a file');
      return;
    }

    setUploading(true);
    setError('');

    try {
      await onUpload(selectedFile, {
        title,
        subject_code: subjectCode || null,
        department_code: departmentCode || null,
        semester: semester ? parseInt(semester) : null
      });
      
      // Reset form
      setTitle('');
      setSubjectCode('');
      setDepartmentCode('');
      setSemester('');
      setSelectedFile(null);
      onClose();
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Upload Textbook</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Textbook Title"
            required
            placeholder="Introduction to Machine Learning"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Input
            label="Subject Code (Optional)"
            placeholder="BCS501"
            value={subjectCode}
            onChange={(e) => setSubjectCode(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Department (Optional)"
              placeholder="CS"
              value={departmentCode}
              onChange={(e) => setDepartmentCode(e.target.value)}
            />

            <Input
              label="Semester (Optional)"
              type="number"
              min="1"
              max="8"
              placeholder="5"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
            />
          </div>

          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-700 font-medium mb-2">
              Drag & drop PDF here or click to browse
            </p>
            <p className="text-sm text-gray-500">
              Supported: PDF only • Max size: 100 MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {selectedFile && (
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={clearFile}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedFile || uploading}>
              {uploading ? 'Uploading...' : 'Upload Textbook'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default UploadModal;
