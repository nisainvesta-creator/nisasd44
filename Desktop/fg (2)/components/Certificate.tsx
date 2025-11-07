
import React, { useState } from 'react';
import { ArrowLeftIcon } from './Icons';
import { useLanguage } from '../hooks/useLanguage';

interface CertificateProps {
  onBack: () => void;
}

type CertificateTab = 'msb' | 'certificate';

const MSBContent: React.FC = () => {
    const { t } = useLanguage();
    return (
        <>
            <p className="text-center">
                <strong className="text-blue-600">{t('certificate.msb.title')}</strong>
            </p>
            <p className="text-justify my-4">{t('certificate.msb.p1')}</p>
            <p className="text-justify my-4">
                <strong className="text-blue-600">{t('certificate.msb.subTitle1')}</strong>
            </p>
            <img src="https://a8m4u5.aibotbnb88.cc/upload/20250808/2025080891839.jpeg" alt="US MSB License Document" className="w-full my-4 rounded" />
            <p className="text-justify my-4">{t('certificate.msb.p2')}</p>
            <p className="text-justify my-4 break-all">
                <strong className="text-blue-600">{t('certificate.msb.queryAddress')}: https://www.fincen.gov/msb-state-selector</strong>
            </p>
            <img src="https://a8m4u5.aibotbnb88.cc/upload/20250808/2025080856457.jpg" alt="MSB License Query Website" className="w-full my-4 rounded" />
            <p className="text-justify my-4">{t('certificate.msb.p3')}</p>
            <p className="text-justify my-4">{t('certificate.msb.p4')}</p>
        </>
    );
};

const CertificateContent: React.FC = () => {
    const { t } = useLanguage();
    return (
        <>
            <p className="text-center">
                <strong className="text-blue-600">{t('certificate.cert.title')}</strong>
            </p>
            <p className="text-center my-2">
                <strong className="text-blue-600">{t('certificate.cert.subTitle')}</strong>
            </p>
            <p className="text-justify my-4">{t('certificate.cert.p1')}</p>
            <p className="text-justify my-4">
                <strong className="text-blue-600">{t('certificate.cert.subTitle2')}</strong>
            </p>
            <img src="https://a8m4u5.aibotbnb88.cc/upload/20250808/2025080845229.jpeg" alt="American Company Certificate" className="w-full my-4 rounded" />
            <p className="text-justify my-4">
                {t('certificate.cert.companyName')}: <strong className="text-blue-600">COIN8 EX MINING</strong>
            </p>
            <p className="text-justify my-4">
                {t('certificate.cert.companyAddress')}: <strong className="text-blue-600">1312 17TH ST UNIT NUM 2955, Denver, CO 80202, US</strong>
            </p>
            <img src="https://a8m4u5.aibotbnb88.cc/upload/20250808/2025080825331.jpg" alt="Company Address" className="w-full my-4 rounded" />
            <p className="text-justify my-4 break-all">
                {t('certificate.cert.queryAddress')}: <strong className="text-blue-600">https://www.sos.state.co.us/biz/BusinessEntityDetail.do?quitButtonDestination=BusinessEntityResults&amp;nameTyp=ENT&amp;masterFileId=20241541463&amp;entityId2=20241541463&amp;fileId=20241541463&amp;srchTyp=ENTITY</strong>
            </p>
        </>
    );
};


const Certificate: React.FC<CertificateProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<CertificateTab>('msb');
  const { t } = useLanguage();

  const TabButton: React.FC<{ tab: CertificateTab; label: string }> = ({ tab, label }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex-1 py-3 font-semibold transition-colors duration-200 ${
        activeTab === tab 
          ? 'text-[#07c160] border-b-2 border-[#07c160]' 
          : 'text-gray-600 border-b-2 border-transparent'
      }`}
      role="tab"
      aria-selected={activeTab === tab}
    >
      {label}
    </button>
  );


  return (
    <div className="bg-white min-h-screen">
      <header className="sticky top-0 bg-white z-10 border-b border-gray-200">
        <div className="h-12 flex items-center justify-center relative">
          <button onClick={onBack} className="absolute left-4" aria-label="Go back">
            <ArrowLeftIcon className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold">{t('certificate.pageTitle')}</h1>
        </div>
      </header>
      
      <nav className="flex text-center border-b border-gray-200">
        <TabButton tab="msb" label={t('certificate.tabs.msb')} />
        <TabButton tab="certificate" label={t('certificate.tabs.certificate')} />
      </nav>

      <div className="p-4 text-gray-800 leading-relaxed">
        {activeTab === 'msb' && <MSBContent />}
        {activeTab === 'certificate' && <CertificateContent />}
      </div>
    </div>
  );
};

export default Certificate;
