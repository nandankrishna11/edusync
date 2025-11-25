/**
 * Welcome Banner Component
 * Displays personalized greeting with college branding
 */
import { useAuth } from '../features/auth/hooks/useAuth';
import collegeConfig from '../config/collegeConfig';

const WelcomeBanner = () => {
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getMotivationalQuote = () => {
    const quotes = [
      "Excellence is not a destination; it is a continuous journey.",
      "Innovation distinguishes between a leader and a follower.",
      "The future belongs to those who believe in the beauty of their dreams.",
      "Education is the most powerful weapon to change the world.",
      "Success is the sum of small efforts repeated day in and day out."
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 mb-8 shadow-2xl">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Greeting */}
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {getGreeting()}, {user?.full_name || user?.username}! 👋
            </h1>
            
            {/* College Motto */}
            <p className="text-xl text-yellow-300 font-semibold italic mb-4">
              "{collegeConfig.motto}"
            </p>

            {/* Motivational Quote */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 max-w-2xl">
              <p className="text-white/90 text-sm italic">
                💡 {getMotivationalQuote()}
              </p>
            </div>

            {/* Quick Info */}
            <div className="mt-4 flex flex-wrap gap-3">
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/30">
                <span className="text-white text-sm font-medium">
                  📅 {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/30">
                <span className="text-white text-sm font-medium capitalize">
                  👤 {user?.role}
                </span>
              </div>
            </div>
          </div>

          {/* Logo */}
          <div className="hidden md:block ml-6">
            <img 
              src={collegeConfig.images.logo} 
              alt="KVG Logo" 
              className="w-24 h-24 drop-shadow-2xl"
            />
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
    </div>
  );
};

export default WelcomeBanner;
