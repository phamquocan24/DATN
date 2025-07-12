import CTAImage from '../../assets/CTA.png';

export const CTA = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-[#007BFF] via-[#007BFF] to-[#0056b3] relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 right-10 w-32 h-32 bg-white rounded-full"></div>
        <div className="absolute bottom-20 left-20 w-20 h-20 bg-white rounded-full"></div>
        <div className="absolute top-1/2 left-10 w-16 h-16 bg-white rounded-full"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
          {/* Left content */}
          <div className="mb-8 lg:mb-0">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              Start posting<br />
              jobs today
            </h2>
            <p className="text-[#007BFF]/80 text-xl mb-8 leading-relaxed">
              Start posting jobs for only $10.
            </p>
            <button className="bg-white text-[#007BFF] px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-50 transform hover:scale-105 transition-all duration-200 shadow-lg">
              Sign Up For Free
            </button>
          </div>

          {/* Right content - CTA Image */}
          <div className="relative">
            <div className="relative transform hover:scale-105 transition-transform duration-300">
              <img 
                src={CTAImage} 
                alt="Dashboard analytics preview" 
                className="w-full h-auto object-contain rounded-2xl shadow-2xl"
              />
              {/* Subtle glow effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#007BFF]/20 to-transparent rounded-2xl"></div>
            </div>
            
            {/* Floating decorative elements */}
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 rounded-full animate-pulse"></div>
            <div className="absolute -bottom-6 -left-6 w-6 h-6 bg-green-400 rounded-full animate-bounce"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA; 