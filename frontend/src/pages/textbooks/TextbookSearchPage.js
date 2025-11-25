import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Loader } from '../../features/textbooks/components/Icons';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../../features/textbooks/components/SearchBar';
import { textbookService } from '../../features/textbooks/services/textbookService';

const TextbookSearchPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [textbooks, setTextbooks] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [history, books] = await Promise.all([
        textbookService.getSearchHistory(5),
        textbookService.listTextbooks()
      ]);
      setRecentSearches(history);
      setTextbooks(books.filter(tb => tb.processing_status === 'completed'));
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const handleSearch = async (query) => {
    setLoading(true);
    try {
      const result = await textbookService.searchTextbooks(query);
      navigate('/textbooks/results', { state: { result, query } });
    } catch (err) {
      alert('Search failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecentSearchClick = (query) => {
    handleSearch(query);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Ask Your Textbook</h1>
          <p className="text-lg text-gray-600">Get instant answers from your course materials</p>
        </div>

        {/* Search Bar */}
        <div className="mb-12">
          <SearchBar onSearch={handleSearch} loading={loading} />
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            <span className="ml-3 text-gray-600">Searching textbooks...</span>
          </div>
        )}

        {/* Recent Searches */}
        {!loading && recentSearches.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Searches</h2>
            <div className="space-y-2">
              {recentSearches.map((search) => (
                <button
                  key={search.id}
                  onClick={() => handleRecentSearchClick(search.query)}
                  className="w-full text-left p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <Search className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{search.query}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Available Textbooks */}
        {!loading && textbooks.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Available Textbooks ({textbooks.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {textbooks.map((textbook) => (
                <div
                  key={textbook.id}
                  className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{textbook.title}</h3>
                      {textbook.subject_code && (
                        <p className="text-sm text-gray-500">{textbook.subject_code}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && textbooks.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No textbooks available</h3>
            <p className="text-gray-600">Ask your professor to upload course textbooks</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TextbookSearchPage;
