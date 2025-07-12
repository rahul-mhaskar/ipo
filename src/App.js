import React from "react";
import IpoTable from "./components/IpoTable";
import BrokerBanner from "./components/BrokerBanner";
import FloatingBanner from "./components/FloatingBanner";
import AllotmentPopup from "./components/AllotmentPopup";
import { useIpoData } from "./hooks/useIpoData";
import { FaWhatsapp } from "react-icons/fa";

export default function App() {
  const {
    ipoList,
    showFloatingBanner,
    selectedIpo,
    handleApplyClick,
    handleCloseFloatingBanner,
    handleAllotmentClick,
    allotmentPopupData,
    handleCloseAllotmentPopup,
  } = useIpoData();

  return (
    <div>
      {/* Fixed Top Logo Header */}
      <header className="bg-blue-700 text-white py-4 shadow-md fixed top-0 w-full z-50">
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-center">
          <img
            src="/logo.png"
            alt="IPO Track Logo"
            className="w-20 h-20 mb-2 hover:scale-105 transition-transform duration-300"
          />
          <h1 className="text-2xl font-bold">IPO Track</h1>
          <p className="text-sm text-blue-100">
            Your trusted IPO updates, allotments & broker referrals
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-32">
        <IpoTable
          ipoList={ipoList}
          onApplyClick={handleApplyClick}
          onAllotmentClick={handleAllotmentClick}
        />

        {/* WhatsApp Channel */}
        <div className="mt-6 text-center">
          <a
            href="https://whatsapp.com/channel/0029VbBPaggaCHaKAwEkOhhf9zdRl34"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-full shadow hover:bg-green-700"
          >
            <FaWhatsapp size={20} /> Get Update via WhatsApp Channel
          </a>
        </div>
      </div>

      {/* Fixed Broker Banner */}
      <footer
        id="broker-section"
        className="fixed bottom-0 left-0 w-full bg-white border-t shadow z-40"
      >
        <div className="max-w-7xl mx-auto px-4 py-3">
          <h2 className="text-md font-semibold mb-2 text-center hover:text-blue-600 transition-all">
            🛡️ Open Demat account securely with verified investment brokers.
          </h2>
          <div className="flex flex-wrap justify-center gap-4 overflow-x-auto pb-2">
            <BrokerBanner floating={false} />
          </div>
        </div>
      </footer>

      {/* Floating Banner on Apply Now */}
      {showFloatingBanner && selectedIpo && (
        <FloatingBanner
          ipo={selectedIpo}
          onClose={handleCloseFloatingBanner}
        />
      )}

      {/* Allotment Popup */}
      {allotmentPopupData && (
        <AllotmentPopup
          ipo={allotmentPopupData}
          onClose={handleCloseAllotmentPopup}
        />
      )}
    </div>
  );
}
