import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ThumbsUp, ThumbsDown } from '../../features/textbooks/components/Icons';
import Button from '../../components/ui/Button';
import AIAnswerCard from '../../features/textbooks/components/AIAnswerCard';
import SourceCard from '../../features/textbooks/components/SourceCard';
import { textbookService } from '../../features/textbooks/services/textbookService';

const SearchResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { result, query } = location.state || {};
  const [feedback, setFeedback] = useState(null);

  if (!result) {
    navigate('/textbooks/search');
    return null;
  }

  const handleFeedback = async (type) => {
    try {
      await textbookService.submitFeedback(result.search_id, type);
      setFeedback(type);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
  };

  const handleOpenPDF = (textbookId, page) => {
    const url = textbookService.getPdfUrl(textbookId);
    window.open(`${url}#page=${page}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/textbooks/search')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Search</span>
        </button>

        {/* Query */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Search Results</h2>
          <p className="text-gray-600">Query: "{query}"</p>
        </div>

        {/* AI Answer */}
        <AIAnswerCard
          answer={result.answer}
          sourceCount={result.sources?.length || 0}
        />

        {/* Sources */}
        {result.sources && result.sources.length > 0 && (
          <div className="space-y-4 mb-8">
            {result.sources.map((source, index) => (
              <SourceCard
                key={index}
                source={source}
                index={source.index || index + 1}
                onOpenPDF={handleOpenPDF}
              />
            ))}
          </div>
        )}

        {/* Feedback */}
        <div className="flex items-center justify-center space-x-4 py-6 border-t border-gray-200">
          <span className="text-gray-600">Was this answer helpful?</span>
          <Button
            variant={feedback === 'helpful' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => handleFeedback('helpful')}
          >
            <ThumbsUp className="w-4 h-4 mr-2" />
            Helpful
          </Button>
          <Button
            variant={feedback === 'not_helpful' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => handleFeedback('not_helpful')}
          >
            <ThumbsDown className="w-4 h-4 mr-2" />
            Not Helpful
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SearchResultsPage;
