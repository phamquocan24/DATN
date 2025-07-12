import { useState } from 'react';
import { Footer } from './Footer';
import { CTA } from './CTA';
import GroupUnderline from '../assets/Group.png';

interface Company {
  id: number;
  name: string;
  location: string;
  description: string;
  jobs: number;
  logo: string;
  logoColor: string;
  category: string;
  isFavorite?: boolean;
}

interface CompaniesProps {
  onCompanyClick?: (companyId: string) => void;
}

export const Companies: React.FC<CompaniesProps> = ({ onCompanyClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('Florence, Italy');
  const [activeCategory, setActiveCategory] = useState('Design');
  const [favoriteCompanies, setFavoriteCompanies] = useState<number[]>([1]);

  // Recommended Companies
  const recommendedCompanies: Company[] = [
    {
      id: 1,
      name: 'Nomad',
      location: 'Paris, France',
      description: 'Nomad is located in Paris, France. Nomad has generated $728.8M in sales (USD).',
      jobs: 3,
      logo: 'N',
      logoColor: 'bg-green-500 text-white',
      category: 'Design',
      isFavorite: true
    },
    {
      id: 2,
      name: 'Discord',
      location: 'San Francisco, USA',
      description: "We'd love to work with someone like you. We care about creating a delightful experience.",
      jobs: 3,
      logo: 'D',
      logoColor: 'bg-purple-500 text-white',
      category: 'Technology'
    },
    {
      id: 3,
      name: 'Maze',
      location: 'Berlin, Germany',
      description: "We're a passionate bunch working from all over the world to build the future of rapid testing together.",
      jobs: 3,
      logo: 'M',
      logoColor: 'bg-[#007BFF] text-white',
      category: 'Design'
    },
    {
      id: 4,
      name: 'Udacity',
      location: 'Mountain View, USA',
      description: 'Udacity is the trusted market leader of online university that teaches the actual programming skills.',
      jobs: 3,
      logo: 'U',
      logoColor: 'bg-[#007BFF] text-white',
      category: 'Education'
    },
    {
      id: 5,
      name: 'Webflow',
      location: 'San Francisco, USA',
      description: 'Webflow is the leading visual development and hosting platform built from the ground up for the mobile age.',
      jobs: 3,
      logo: 'W',
      logoColor: 'bg-[#007BFF] text-white',
      category: 'Technology'
    },
    {
      id: 6,
      name: 'Foundation',
      location: 'New York, USA',
      description: 'Foundation helps creators mint and auction their digital artworks as NFTs on the Ethereum blockchain.',
      jobs: 3,
      logo: 'F',
      logoColor: 'bg-black text-white',
      category: 'Crypto'
    }
  ];

  // Companies by category
  const categories = [
    { name: 'Design', count: 24, active: true },
    { name: 'Fintech', count: 12, active: false },
    { name: 'Hosting', count: 8, active: false },
    { name: 'Business Service', count: 15, active: false },
    { name: 'Development', count: 18, active: false }
  ];

  const designCompanies = [
    { name: 'Pentagram', logo: 'P', logoColor: 'bg-red-500 text-white', jobs: 3 },
    { name: 'Wolff Olins', logo: 'WO', logoColor: 'bg-black text-white', jobs: 4 },
    { name: 'Clay', logo: 'C', logoColor: 'bg-black text-white', jobs: 3 },
    { name: 'MediaMonks', logo: 'MM', logoColor: 'bg-black text-white', jobs: 5 },
    { name: 'Packer', logo: 'P', logoColor: 'bg-red-400 text-white', jobs: 3 },
    { name: 'Square', logo: 'S', logoColor: 'bg-black text-white', jobs: 3 },
    { name: 'Divy', logo: 'D', logoColor: 'bg-gray-800 text-white', jobs: 3 },
    { name: 'WebFlow', logo: 'W', logoColor: 'bg-[#007BFF] text-white', jobs: 5 }
  ];

  const toggleFavorite = (companyId: number) => {
    setFavoriteCompanies(prev => 
      prev.includes(companyId) 
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    );
  };

  const CompanyCard = ({ company, showDescription = true }: { company: Company, showDescription?: boolean }) => (
    <div 
      className="bg-white border border-gray-200 rounded-lg p-6 hover:border-[#007BFF]/30 transition-all duration-200 group cursor-pointer"
      onClick={() => onCompanyClick?.(company.id.toString())}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold ${company.logoColor}`}>
            {company.logo}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-[#007BFF] transition-colors">
              {company.name}
            </h3>
            <p className="text-sm text-gray-500">{company.location}</p>
          </div>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(company.id);
          }}
          className={`transition-colors ${
            favoriteCompanies.includes(company.id) 
              ? 'text-red-500 hover:text-red-600' 
              : 'text-gray-400 hover:text-red-500'
          }`}
        >
          <svg className="w-5 h-5" fill={favoriteCompanies.includes(company.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      {showDescription && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {company.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">
          {company.jobs} jobs
        </span>
        <div className="flex space-x-2">
          <span className="px-3 py-1 bg-[#007BFF]/10 text-[#007BFF] text-xs rounded-full font-medium">
            {company.category}
          </span>
        </div>
      </div>
    </div>
  );

  const SmallCompanyCard = ({ company }: { company: any }) => (
    <div 
      className="bg-white border border-gray-200 rounded-lg p-4 hover:border-[#007BFF]/30 transition-all duration-200 group text-center cursor-pointer"
      onClick={() => onCompanyClick?.(company.id?.toString() || company.name)}
    >
      <div className={`w-16 h-16 rounded-lg flex items-center justify-center font-bold ${company.logoColor} mx-auto mb-3`}>
        {company.logo}
      </div>
      <h3 className="font-semibold text-gray-900 group-hover:text-[#007BFF] transition-colors mb-2">
        {company.name}
      </h3>
      <p className="text-sm text-gray-500">{company.jobs} jobs</p>
    </div>
  );

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Find your <span className="text-[#007BFF] relative inline-block">
                  dream companies
                  <img 
                    src={GroupUnderline} 
                    alt="underline" 
                    className="absolute -bottom-6 left-0 w-full h-6 object-contain transform scale-125"
                  />
                </span>
              </h1>
              <p className="text-gray-600 mt-4">
                Find the dream companies you dream work for
              </p>
            </div>

            {/* Search */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 mb-6">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 flex items-center px-4 py-3">
                  <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Company name or keyword"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
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
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full outline-none text-gray-900 placeholder-gray-500"
                  />
                </div>
                
                <button className="bg-[#007BFF] text-white px-6 py-3 rounded-md font-medium hover:bg-[#0056b3] transition-colors">
                  Search
                </button>
              </div>
            </div>

            {/* Popular tags */}
            <div className="text-center text-sm text-gray-600">
              <span className="mr-2">Popular:</span>
              <span className="text-gray-800">Twitter, Microsoft, Apple, Facebook</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Recommended Companies */}
          <div className="mb-16">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Recommended Companies</h2>
              <p className="text-gray-600">Based on your profile, company preferences, and recent activity</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedCompanies.map((company) => (
                <CompanyCard key={company.id} company={company} />
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="mb-16">
            <CTA />
          </div>

          {/* Companies by Category */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Companies by Category</h2>
            
            {/* Category Tabs */}
            <div className="flex space-x-1 mb-8 bg-gray-100 rounded-lg p-1 w-fit">
              {categories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => setActiveCategory(category.name)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeCategory === category.name
                      ? 'bg-[#007BFF] text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                <span className="text-[#007BFF] font-medium">24 Results</span>
              </p>
              <button className="text-[#007BFF] hover:text-[#007BFF] font-medium">
                View all
              </button>
            </div>

            {/* Companies Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              {designCompanies.map((company, index) => (
                <SmallCompanyCard key={index} company={company} />
              ))}
            </div>

            {/* View more link */}
            <div className="text-center">
              <button className="text-[#007BFF] hover:text-[#007BFF] font-medium flex items-center mx-auto">
                View more Design companies
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </>
  );
};

export default Companies; 