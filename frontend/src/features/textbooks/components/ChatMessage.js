import React from 'react';
import { User, Sparkles, BookOpen, ExternalLink } from './Icons';

const ChatMessage = ({ message, onOpenPDF }) => {
  const isUser = message.sender === 'user';
  const [showFullAnswer, setShowFullAnswer] = React.useState(false);

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3 max-w-4xl w-full`}>
        {/* Avatar */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ${
          isUser ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-purple-500 to-indigo-600'
        }`}>
          {isUser ? (
            <User className="w-5 h-5 text-white" />
          ) : (
            <Sparkles className="w-5 h-5 text-white" />
          )}
        </div>

        {/* Message Content */}
        <div className={`flex-1 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
          {/* Sender Label */}
          <div className={`text-xs font-medium text-gray-500 mb-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {isUser ? 'You' : 'AI Assistant'}
          </div>

          {/* Summary Badge for Assistant (if available) */}
          {!isUser && message.summary && (
            <div className="mb-3 w-full">
              <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-400 rounded-lg shadow-sm">
                <div className="flex items-start gap-2">
                  <span className="text-lg">💡</span>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-1">Quick Summary</div>
                    <p className="text-sm text-amber-900 leading-relaxed">{message.summary}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Message Bubble */}
          <div className={`w-full px-5 py-4 rounded-2xl shadow-sm ${
            isUser 
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' 
              : 'bg-white border border-gray-200 text-gray-900'
          }`}>
            {!isUser && message.summary && !showFullAnswer ? (
              <div>
                <p className="text-gray-700 leading-relaxed mb-3">
                  {message.content.substring(0, 200)}...
                </p>
                <button
                  onClick={() => setShowFullAnswer(true)}
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-semibold transition-colors"
                >
                  <span>Read full answer</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            ) : (
              <>
                <p className="whitespace-pre-wrap leading-relaxed text-base">{message.content}</p>
                {!isUser && message.summary && (
                  <button
                    onClick={() => setShowFullAnswer(false)}
                    className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm font-medium mt-3 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Show summary only</span>
                  </button>
                )}
              </>
            )}
          </div>

          {/* Sources for assistant messages */}
          {!isUser && message.sources && message.sources.length > 0 && (
            <div className="mt-4 w-full">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span>Sources ({message.sources.length})</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {message.sources.map((source, idx) => (
                  <div 
                    key={idx}
                    className="group bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
                    onClick={() => onOpenPDF(source.textbook_id, source.page)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                            {idx + 1}
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            {source.textbook_title || `Textbook ${source.textbook_id}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-600 ml-8">
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            Page {source.page}
                          </span>
                          {source.relevance && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <span className="font-medium text-green-600">{source.relevance}%</span>
                                <span>relevant</span>
                              </span>
                            </>
                          )}
                        </div>
                        {source.excerpt && (
                          <p className="text-xs text-gray-600 mt-2 ml-8 line-clamp-2 italic">
                            "{source.excerpt.substring(0, 100)}..."
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0 ml-3">
                        <div className="flex items-center gap-2 text-blue-600 group-hover:text-blue-700 font-medium text-sm">
                          <span>Open PDF</span>
                          <ExternalLink className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div className={`text-xs text-gray-400 mt-2 ${isUser ? 'text-right' : 'text-left'}`}>
            {message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
