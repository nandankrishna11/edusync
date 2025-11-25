import React from 'react';
import { Sparkles, BookOpen, Copy } from './Icons';

const AIAnswerCard = ({ answer, sourceCount }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(answer);
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">AI Answer</h3>
      </div>

      <div className="prose prose-blue max-w-none">
        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
          {answer}
        </p>
      </div>

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-blue-200">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <BookOpen className="w-4 h-4" />
          <span>Sources: {sourceCount} textbook reference{sourceCount !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="text-gray-500 hover:text-blue-600 transition-colors p-2"
            title="Copy answer"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAnswerCard;
