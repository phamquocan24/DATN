import AMDLogo from '../../assets/amd-logo-1.png';
import IntelLogo from '../../assets/intel-3.png';
import TeslaLogo from '../../assets/TESLA.png';
import TalkitLogo from '../../assets/talkit1.png';

export const CompanyLogos = () => {
  return (
    <section className="bg-white py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-left text-gray-500 text-sm mb-8">Companies we helped grow</p>
        <div className="flex justify-between items-center opacity-60">
          <div className="text-gray-400 font-bold text-lg">vodafone</div>
          <img src={IntelLogo} alt="Intel" className="h-8 object-contain" />
          <img src={TeslaLogo} alt="Tesla" className="h-8 object-contain" />
          <img src={AMDLogo} alt="AMD" className="h-8 object-contain" />
          <img src={TalkitLogo} alt="Talkit" className="h-8 object-contain" />
        </div>
      </div>
    </section>
  );
};

export default CompanyLogos; 