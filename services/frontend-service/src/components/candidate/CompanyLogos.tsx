import ViettelLogo from '../../assets/viettel-logo.png';
import CMCLogo from '../../assets/logo-cmc.png';
import FPTLogo from '../../assets/logo-fpt.png';
import ShopeeLogo from '../../assets/logo-shopee.png';
import VNGLogo from '../../assets/vng-logo.png';

export const CompanyLogos = () => {
  return (
    <section className="bg-white py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-left text-gray-500 text-sm mb-8">Companies we helped grow</p>
        <div className="flex justify-between items-center opacity-90">
          <img src={FPTLogo} alt="FPT Corporation" className="h-20 object-contain transition-transform duration-300 ease-in-out hover:scale-110" />
          <img src={CMCLogo} alt="CMC Corporation" className="h-12 object-contain transition-transform duration-300 ease-in-out hover:scale-110" />
          <img src={ViettelLogo} alt="Viettel Group" className="h-12 object-contain transition-transform duration-300 ease-in-out hover:scale-110" />
          <img src={ShopeeLogo} alt="Shopee" className="h-14 object-contain transition-transform duration-300 ease-in-out hover:scale-110" />
          <img src={VNGLogo} alt="VNG Corporation" className="h-12 object-contain transition-transform duration-300 ease-in-out hover:scale-110" />
        </div>
      </div>
    </section>
  );
};

export default CompanyLogos; 