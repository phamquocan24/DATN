import CTAImage from '../../assets/CTA.png';

interface CTAProps {
  onSignUpClick: () => void;
}

export const CTA: React.FC<CTAProps> = ({ onSignUpClick }) => {
  return (
    <section 
      className="py-20 bg-[#007BFF] relative"
      style={{ clipPath: 'polygon(15% 0, 100% 0, 100% 85%, 85% 100%, 0 100%, 0 15%)' }}
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 right-10 w-32 h-32 bg-white rounded-full"></div>
        <div className="absolute bottom-20 left-20 w-20 h-20 bg-white rounded-full"></div>
        <div className="absolute top-1/2 left-10 w-16 h-16 bg-white rounded-full"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
          {/* Left content */}
          <div className="mb-8 lg:mb-0 text-left">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              Start posting<br />
              jobs today
            </h2>
            <p className="text-white/80 text-xl mb-8 leading-relaxed">
              Start posting jobs for only $10.
            </p>
            <button 
              onClick={onSignUpClick}
              className="bg-white text-[#007BFF] px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-50 transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              Sign Up For Free
            </button>
          </div>

          {/* Right content - CTA Image */}
          <div className="relative">
            <div className="relative transform hover:scale-105 transition-transform duration-300">
              <img 
                src={CTAImage} 
                alt="Dashboard analytics preview" 
                className="w-full h-auto object-contain rounded-2xl shadow-2xl transform scale-110"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA; 