/**
 * Loading Screen Component
 * Branded loading screen with KVG logo and motto
 */
import collegeConfig from '../config/collegeConfig';

const LoadingScreen = ({ message = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center z-50">
      <div className="text-center">
        {/* Animated Logo */}
        <div className="mb-8 animate-bounce">
          <img 
            src={collegeConfig.images.logo} 
            alt="KVG Logo" 
            className="w-32 h-32 mx-auto drop-shadow-2xl"
          />
        </div>

        {/* App Name */}
        <h1 className="text-4xl font-bold text-white mb-2 animate-pulse">
          {collegeConfig.appName}
        </h1>

        {/* College Name */}
        <p className="text-xl text-blue-100 mb-4">
          {collegeConfig.name}
        </p>

        {/* Motto */}
        <p className="text-lg text-yellow-300 italic mb-8">
          "{collegeConfig.motto}"
        </p>

        {/* Loading Spinner */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
        </div>

        {/* Loading Message */}
        <p className="text-white text-sm animate-pulse">
          {message}
        </p>

        {/* Progress Dots */}
        <div className="flex justify-center space-x-2 mt-4">
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
