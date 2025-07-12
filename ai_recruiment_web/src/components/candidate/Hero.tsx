
import Man1 from '../../assets/man1.png';
import GroupUnderline from '../../assets/Group.png';

export const Hero = () => {
  return (
    <section className="bg-gray-50 py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
          {/* Left content */}
          <div className="mb-12 lg:mb-0">
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight mb-10">
              Discover more than{' '}
              <span className="text-[#007BFF] relative inline-block">
                5000+ Jobs
                <img 
                  src={GroupUnderline} 
                  alt="underline" 
                  className="absolute -bottom-4 left-0 w-full h-6 object-contain transform scale-125"
                />
              </span>
            </h1>
              
              <p className="text-lg text-gray-600 mb-8 max-w-md mt-2">
              Great platform for the job seeker that searching for 
              new career heights and passionate about startups.
            </p>

            {/* Search bar */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 mb-8 max-w-4xl">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 flex items-center px-4 py-3">
                  <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Job title or keyword"
                    className="w-full outline-none text-gray-900 placeholder-gray-500"
                  />
                </div>
                
                <div className="flex-1 flex items-center px-4 py-3 border-l border-gray-200">
                  <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Florence, Italy"
                    className="w-full outline-none text-gray-900 placeholder-gray-500"
                  />
                </div>
                
                <button className="bg-[#007BFF] text-white px-3 py-2 rounded-md font-medium hover:bg-[#0056b3] transition-colors text-sm flex-shrink-0">
                  Search my job
                </button>
              </div>
            </div>

            {/* Popular tags */}
            <div className="text-sm text-gray-600 text-left max-w-4xl">
              <span className="mr-2">Popular:</span>
              <span className="text-gray-800">UI Designer, UX Researcher, Android, Admin</span>
            </div>
          </div>

          {/* Right content - Hero image with person */}
          <div className="relative">
            <div className="relative z-10 flex items-center justify-center">
              {/* Hero person image */}
              <div className="relative">
                <img 
                  src={Man1} 
                  alt="Professional man with glasses" 
                  className="w-80 h-auto object-cover"
                />
                
                {/* Floating elements */}
                <div className="absolute top-8 -right-4 bg-white rounded-lg p-3 shadow-lg transform rotate-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs font-medium">Job Match</div>
                      <div className="text-xs text-gray-500">95% Match</div>
                    </div>
                  </div>
                </div>
                
                <div className="absolute bottom-12 -left-4 bg-white rounded-lg p-3 shadow-lg transform -rotate-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-[#007BFF] rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs font-medium">New Job</div>
                      <div className="text-xs text-gray-500">Frontend Dev</div>
                    </div>
                  </div>
                </div>

                {/* Geometric shapes decoration */}
                <div className="absolute -top-4 right-8 w-12 h-12 border-2 border-[#007BFF]/20 rounded-lg transform rotate-45 opacity-50"></div>
                <div className="absolute top-16 -right-8 w-8 h-8 bg-yellow-200 rounded-full opacity-60"></div>
                <div className="absolute bottom-20 right-12 w-6 h-6 bg-purple-200 rounded-full opacity-50"></div>
                <div className="absolute -bottom-2 left-16 w-10 h-10 border-2 border-green-200 rounded-full opacity-40"></div>
                
                {/* Grid lines */}
                <div className="absolute -inset-4 opacity-10">
                  <svg width="100%" height="100%" className="text-gray-400">
                    <defs>
                      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="1"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>


      </div>
    </section>
  );
};

export default Hero; 