import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Send, Loader, Settings, Sparkles } from '../../features/textbooks/components/Icons';
import Button from '../../components/ui/Button';
import ChatMessage from '../../features/textbooks/components/ChatMessage';
import { chatService } from '../../features/textbooks/services/chatService';

const ChatPage = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [showSubjectFilter, setShowSubjectFilter] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadSubjects();
    if (sessionId) {
      loadSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSubjects = async () => {
    try {
      const data = await chatService.getSubjects();
      const opted = data.opted_subjects.map(s => s.subject_code);
      setSubjects(data.available_subjects);
      setSelectedSubjects(opted);
    } catch (err) {
      console.error('Failed to load subjects:', err);
    }
  };

  const loadSession = async () => {
    try {
      const data = await chatService.getSession(sessionId);
      setSession(data);
      setMessages(data.messages);
      setSelectedSubjects(data.subject_codes);
    } catch (err) {
      console.error('Failed to load session:', err);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      sender: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatService.askQuestion(
        input,
        selectedSubjects.length > 0 ? selectedSubjects : null,
        session?.id || null
      );

      const assistantMessage = {
        sender: 'assistant',
        content: response.answer,
        summary: response.summary,
        sources: response.sources,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (!session) {
        setSession({ id: response.session_id });
        navigate(`/student/textbooks/chat/${response.session_id}`, { replace: true });
      }
    } catch (err) {
      const errorMessage = {
        sender: 'assistant',
        content: err.message || 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleOpenPDF = (textbookId, page) => {
    const token = localStorage.getItem('token');
    // Open PDF with token as query parameter and page anchor
    const url = `http://localhost:8000/api/textbooks/${textbookId}/pdf?token=${encodeURIComponent(token)}#page=${page}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const toggleSubject = (subjectCode) => {
    setSelectedSubjects(prev =>
      prev.includes(subjectCode)
        ? prev.filter(s => s !== subjectCode)
        : [...prev, subjectCode]
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/student/textbooks/search')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Back</span>
            </button>
            <div className="border-l border-gray-300 pl-4">
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-600" />
                {session?.title || 'New Conversation'}
              </h1>
              <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  {selectedSubjects.length} subject{selectedSubjects.length !== 1 ? 's' : ''} selected
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSubjectFilter(!showSubjectFilter)}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Filters</span>
          </button>
        </div>

        {/* Subject Filter */}
        {showSubjectFilter && (
          <div className="max-w-6xl mx-auto mt-4 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filter by Subjects
            </h3>
            <div className="flex flex-wrap gap-2">
              {subjects.filter(s => s.is_opted_in).map(subject => (
                <button
                  key={subject.subject_code}
                  onClick={() => toggleSubject(subject.subject_code)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm ${
                    selectedSubjects.includes(subject.subject_code)
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md scale-105'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400 hover:shadow'
                  }`}
                >
                  {subject.subject_code}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {messages.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl animate-pulse">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Ask Your Textbooks Anything</h2>
              <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
                Get instant, AI-powered answers from your course materials with source citations
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                <button 
                  onClick={() => setInput("Explain the concept of cloud computing")}
                  className="group p-5 text-left bg-white border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 mb-1">Explain concepts</p>
                      <p className="text-sm text-gray-600">"Explain the concept of..."</p>
                    </div>
                  </div>
                </button>
                <button 
                  onClick={() => setInput("What is the difference between")}
                  className="group p-5 text-left bg-white border-2 border-gray-200 rounded-xl hover:border-purple-400 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition-colors">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 mb-1">Compare topics</p>
                      <p className="text-sm text-gray-600">"What is the difference between..."</p>
                    </div>
                  </div>
                </button>
                <button 
                  onClick={() => setInput("How does")}
                  className="group p-5 text-left bg-white border-2 border-gray-200 rounded-xl hover:border-green-400 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-green-200 transition-colors">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 mb-1">Understand processes</p>
                      <p className="text-sm text-gray-600">"How does ... work?"</p>
                    </div>
                  </div>
                </button>
                <button 
                  onClick={() => setInput("Give me an example of")}
                  className="group p-5 text-left bg-white border-2 border-gray-200 rounded-xl hover:border-amber-400 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-amber-200 transition-colors">
                      <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 mb-1">Get examples</p>
                      <p className="text-sm text-gray-600">"Give me an example of..."</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, idx) => (
                <ChatMessage
                  key={idx}
                  message={message}
                  onOpenPDF={handleOpenPDF}
                />
              ))}
              {loading && (
                <div className="flex justify-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl">
                      <Loader className="w-5 h-5 text-gray-400 animate-spin" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 shadow-lg px-6 py-5">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask anything about your textbooks... (Press Enter to send)"
                className="w-full px-5 py-4 pr-12 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-base transition-all shadow-sm"
                rows="1"
                style={{ minHeight: '56px', maxHeight: '120px' }}
                disabled={loading}
              />
              {input.trim() && (
                <div className="absolute right-3 bottom-3 text-xs text-gray-400">
                  Press Enter ↵
                </div>
              )}
            </div>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span className="font-semibold">Thinking...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span className="font-semibold">Send</span>
                </>
              )}
            </Button>
          </div>
          <div className="flex items-center justify-center gap-2 mt-3 text-xs text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>AI-powered answers from your selected textbooks with source citations</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
