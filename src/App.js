import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Papa from "papaparse";

// Import your website logo from the src folder
// IMPORTANT: Replace 'websiteLogo.png' with your actual logo file name and path within src/
import websiteLogo from './Track My IPO - Logo.png'; // Example: if your logo is directly in src/


const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSHEORz3aArzaDTOWYW6FlC1avk1TYKAhDKfyALmqg2HMDWiD60N6WG2wgMlPkvLWC9d7YzwplhCStb/pub?output=csv';
// Use the imported logo for the main website logo
const WEBSITE_LOGO_URL = websiteLogo; // Now uses the imported local asset

const App = () => {
  const [ipoData, setIpoData] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [showBrokerPopup, setShowBrokerPopup] = useState(false);
  const [showAllotmentPopup, setShowAllotmentPopup] = useState(false);
  const [allotmentLinks, setAllotmentLinks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("");
  const [showMessageBox, setShowMessageBox] = useState(false);
  const [layoutMode, setLayoutMode] = useState('full'); // 'full' or 'compact'

  const brokerLinks = useMemo(() => [
    { name: "Angel One", url: "https://bit.ly/4b0L72i", logo: "https://d3v34g7z5c2a12.cloudfront.net/images/angel-one-logo.svg" },
    { name: "Groww", url: "https://app.groww.in/v3/tap?channel=https://groww.in/demat/account?utm_source=unfluke_yt&utm_campaign=open_account_groww_unfluke", logo: "https://d3v34g7z5c2a12.cloudfront.net/images/groww-logo.svg" },
    { name: "Zerodha", url: "https://zerodha.com/open-account?c=BP4449", logo: "https://d3v34g7z5c2a12.cloudfront.net/images/zerodha-logo.svg" },
    { name: "Upstox", url: "https://upstox.com/open-demat-account/?utm_source=unfluke-yt&utm_medium=affiliate&utm_campaign=organic", logo: "https://d3v34g7z5c2a12.cloudfront.net/images/upstox-logo.svg" },
    { name: "M.Stock", url: "https://open.mstock.com/account?utm_source=unfluke&utm_medium=affiliate&utm_campaign=demat&utm_id=demat", logo: "https://d3v34g7z5c2a12.cloudfront.net/images/m-stock-logo.svg" },
    { name: "Dhan", url: "https://join.dhan.co/?utmsrc=partner&utmmed=unfluke", logo: "https://d3v34g7z5c2a12.cloudfront.net/images/dhan-logo.svg" },
    { name: "SMC Global", url: "https://smctradeonline.com/Demat/?utm_source=unfluke&utm_medium=affiliate&utm_campaign=smc-demat-account-open-affiliate", logo: "https://d3v34g7z5c2a12.cloudfront.net/images/smc-logo.svg" },
    { name: "5Paisa", url: "https://www.5paisa.com/demat-account/open-demat-account-with-5paisa?utm_source=unfluke&utm_medium=affiliate", logo: "https://d3v34g7z5c2a12.cloudfront.net/images/5paisa-logo.svg" },
  ], []);

  const fetchIpoData = useCallback(async () => {
    try {
      const response = await fetch(GOOGLE_SHEET_URL);
      const csvData = await response.text();
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setIpoData(results.data);
        },
      });
    } catch (error) {
      console.error("Error fetching or parsing IPO data:", error);
      setMessage("Failed to fetch IPO data. Please try again later.");
      setShowMessageBox(true);
    }
  }, []);

  useEffect(() => {
    fetchIpoData();
  }, [fetchIpoData]);

  const sortedData = useMemo(() => {
    const sortableData = [...ipoData];
    if (sortConfig.key) {
      sortableData.sort((a, b) => {
        const aValue = a[sortConfig.key] || "";
        const bValue = b[sortConfig.key] || "";
        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [ipoData, sortConfig]);

  const filteredData = useMemo(() => {
    if (!searchTerm) {
      return sortedData;
    }
    return sortedData.filter((ipo) =>
      Object.values(ipo).some(
        (value) =>
          value &&
          value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [sortedData, searchTerm]);

  const requestSort = (key) => {
    let direction = "asc";
    if (
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleAllotmentPopup = (links) => {
    const allotmentUrls = links.split(",").map((link) => link.trim());
    setAllotmentLinks(allotmentUrls);
    setShowAllotmentPopup(true);
  };

  const handleBrokerPopup = () => {
    setShowBrokerPopup(true);
  };

  const renderBrokerLinks = () => {
    return brokerLinks.map((broker) => (
      <a
        key={broker.name}
        href={broker.url}
        target="_blank"
        rel="noopener noreferrer"
        className="broker-link inline-block hover:scale-110 transition-transform duration-200"
      >
        <img
          src={broker.logo}
          alt={`${broker.name} logo`}
          className="h-6 w-auto"
        />
      </a>
    ));
  };
  const messageBoxRef = useRef(null);
  useEffect(() => {
    if (showMessageBox) {
      const timer = setTimeout(() => {
        setShowMessageBox(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showMessageBox]);

  const handleResize = () => {
    if (window.innerWidth < 640) { // Tailwind's 'sm' breakpoint is 640px
      setLayoutMode('compact');
    } else {
      setLayoutMode('full');
    }
  };

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    handleResize(); // Set initial layout on component mount
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getSortIcon = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === "asc" ? "▲" : "▼";
    }
    return "";
  };
  

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-100 min-h-screen font-sans text-gray-800 p-2 sm:p-4 md:p-6 lg:p-8">
      {showMessageBox && (
        <div
          ref={messageBoxRef}
          className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-xl z-50 transition-all duration-300 transform scale-100 opacity-100"
        >
          {message}
        </div>
      )}
      <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden p-2 sm:p-4">
        {/* Header Section with Logo, Search, and Demat account links */}
        <header className="flex flex-col sm:flex-row items-center justify-between p-2 sm:p-4 border-b-2 border-gray-100 mb-4">
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            {/* Website Logo */}
            <img src={WEBSITE_LOGO_URL} alt="Website Logo" className="h-10 sm:h-12 w-auto" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-indigo-700 hover:text-purple-700 transition-all text-center sm:text-left">
              Track My IPO
            </h1>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-end w-full sm:w-auto space-y-2 sm:space-y-0 sm:space-x-4 mt-2 sm:mt-0">
            {/* Search Input */}
            <input
              type="text"
              placeholder="Search IPO..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-full shadow-inner focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all"
            />
            
            {/* Open Demat Account Button */}
            <button
              onClick={handleBrokerPopup}
              className="w-full sm:w-auto bg-purple-600 text-white px-6 py-2 rounded-full shadow-md hover:bg-purple-700 hover:scale-105 transition transform font-semibold text-sm"
            >
              Open Demat Account
            </button>
          </div>
        </header>
        
        {/* WhatsApp Channel Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-2 sm:p-4 border-t-2 border-gray-100 mt-4">
          {/* WhatsApp Channel Section */}
            <div className="whatsapp-section text-center sm:text-left mb-0.5 sm:mb-1">
              <a
                href="https://www.whatsapp.com/channel/0029VbBPCHaKAwEkO9zdRl34"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center bg-green-600 text-white px-3 py-1 rounded-full shadow-md hover:bg-green-700 hover:scale-105 transition transform text-xs"
              >
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
                  alt="WhatsApp"
                  className="w-3.5 h-3.5 mr-1"
                />
                WhatsApp Updates
              </a>
            </div>
            
            <div className="flex flex-col items-center sm:items-end">
              <h2 className="text-xs sm:text-sm font-semibold mb-0.5 sm:mb-1 text-center text-gray-800 hover:text-blue-600 transition-all">
                🛡️ Open Demat account securely with verified investment brokers.
              </h2>
              <div className="flex flex-wrap justify-center gap-1 overflow-x-auto pb-0.5">
                {renderBrokerLinks()}
              </div>
            </div>
          </div>
          <p className="text-center text-gray-500 text-xs sm:text-sm mt-1 sm:mt-2 px-2 sm:px-4">
            *All data is for informational purposes only. Please verify with official sources.
          </p>
        
        {/* Main Content */}
        <main className="p-2 sm:p-4">
          <div className="bg-gray-50 rounded-2xl shadow-inner overflow-hidden">
            {filteredData.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No IPOs found matching your search.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-indigo-600 text-white">
                    <tr>
                      <th
                        onClick={() => requestSort("ipo_name")}
                        className="py-3 px-2 sm:px-4 text-left text-xs sm:text-sm font-bold uppercase tracking-wider cursor-pointer hover:bg-indigo-700 transition-colors rounded-tl-2xl"
                      >
                        IPO Name {getSortIcon("ipo_name")}
                      </th>
                      <th
                        onClick={() => requestSort("ipo_type")}
                        className="py-3 px-2 sm:px-4 text-left text-xs sm:text-sm font-bold uppercase tracking-wider cursor-pointer hover:bg-indigo-700 transition-colors"
                      >
                        IPO Type {getSortIcon("ipo_type")}
                      </th>
                      {layoutMode === 'full' && (
                        <>
                          <th
                            onClick={() => requestSort("open_date")}
                            className="py-3 px-2 sm:px-4 text-left text-xs sm:text-sm font-bold uppercase tracking-wider cursor-pointer hover:bg-indigo-700 transition-colors"
                          >
                            Open {getSortIcon("open_date")}
                          </th>
                          <th
                            onClick={() => requestSort("close_date")}
                            className="py-3 px-2 sm:px-4 text-left text-xs sm:text-sm font-bold uppercase tracking-wider cursor-pointer hover:bg-indigo-700 transition-colors"
                          >
                            Close {getSortIcon("close_date")}
                          </th>
                          <th
                            onClick={() => requestSort("listing_date")}
                            className="py-3 px-2 sm:px-4 text-left text-xs sm:text-sm font-bold uppercase tracking-wider cursor-pointer hover:bg-indigo-700 transition-colors"
                          >
                            Listing {getSortIcon("listing_date")}
                          </th>
                          <th className="py-3 px-2 sm:px-4 text-left text-xs sm:text-sm font-bold uppercase tracking-wider">
                            GMP
                          </th>
                          <th className="py-3 px-2 sm:px-4 text-left text-xs sm:text-sm font-bold uppercase tracking-wider">
                            Allotment
                          </th>
                        </>
                      )}
                      {layoutMode === 'compact' && (
                        <th className="py-3 px-2 sm:px-4 text-left text-xs sm:text-sm font-bold uppercase tracking-wider">
                          Details
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.map((ipo, index) => (
                      <tr key={index} className="hover:bg-gray-100 transition-colors">
                        <td className="py-3 px-2 sm:px-4 whitespace-nowrap">
                          <a
                            href={ipo.website_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 font-semibold transition-colors text-sm sm:text-base"
                          >
                            {ipo.ipo_name}
                          </a>
                        </td>
                        <td className="py-3 px-2 sm:px-4 whitespace-nowrap text-sm sm:text-base">
                          <span
                            className={`px-2 inline-flex text-xs sm:text-sm leading-5 font-semibold rounded-full ${
                              ipo.ipo_type === "Mainboard"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {ipo.ipo_type}
                          </span>
                        </td>
                        {layoutMode === 'full' && (
                          <>
                            <td className="py-3 px-2 sm:px-4 whitespace-nowrap text-sm sm:text-base">
                              {ipo.open_date}
                            </td>
                            <td className="py-3 px-2 sm:px-4 whitespace-nowrap text-sm sm:text-base">
                              {ipo.close_date}
                            </td>
                            <td className="py-3 px-2 sm:px-4 whitespace-nowrap text-sm sm:text-base">
                              {ipo.listing_date}
                            </td>
                            <td className="py-3 px-2 sm:px-4 whitespace-nowrap text-sm sm:text-base">
                              <a
                                href={ipo.gmp_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-600 hover:text-green-800 font-semibold transition-colors"
                              >
                                {ipo.gmp_value}
                              </a>
                            </td>
                            <td className="py-3 px-2 sm:px-4 whitespace-nowrap text-sm sm:text-base">
                              <button
                                onClick={() =>
                                  handleAllotmentPopup(ipo.allotment_links)
                                }
                                className="bg-indigo-500 text-white px-4 py-1 rounded-full text-xs sm:text-sm shadow-md hover:bg-indigo-600 transition transform"
                                disabled={!ipo.allotment_links}
                              >
                                Check Allotment
                              </button>
                            </td>
                          </>
                        )}
                        {layoutMode === 'compact' && (
                          <td className="py-3 px-2 sm:px-4 whitespace-nowrap text-sm sm:text-base">
                            <details className="text-sm">
                              <summary className="font-semibold text-purple-600 cursor-pointer hover:underline">
                                View Details
                              </summary>
                              <ul className="mt-2 text-xs text-gray-700 list-disc list-inside">
                                <li><strong>Open:</strong> {ipo.open_date}</li>
                                <li><strong>Close:</strong> {ipo.close_date}</li>
                                <li><strong>Listing:</strong> {ipo.listing_date}</li>
                                <li><strong>GMP:</strong> <a href={ipo.gmp_link} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">{ipo.gmp_value}</a></li>
                                <li><strong>Allotment:</strong> <button onClick={() => handleAllotmentPopup(ipo.allotment_links)} className="text-indigo-600 hover:underline" disabled={!ipo.allotment_links}>Check Allotment</button></li>
                              </ul>
                            </details>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
        
        {/* Allotment Popup Modal */}
        {showAllotmentPopup && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-2xl shadow-xl max-w-lg w-full text-center transform scale-100 animate-fade-in-down">
              <h3 className="text-xl sm:text-2xl font-bold text-indigo-700 mb-4">
                Check Allotment Status
              </h3>
              <div className="flex flex-col space-y-3">
                {allotmentLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-indigo-500 text-white px-4 py-2 rounded-full shadow-md hover:bg-indigo-600 transition transform hover:scale-105"
                  >
                    Allotment Link {index + 1}
                  </a>
                ))}
              </div>
              <button
                onClick={() => setShowAllotmentPopup(false)}
                className="mt-6 bg-red-500 text-white px-4 py-2 rounded-full shadow-md hover:bg-red-600 transition transform hover:scale-105"
              >
                Close
              </button>
            </div>
          </div>
        )}
        
        {/* Broker Popup Modal */}
        {showBrokerPopup && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-2xl shadow-xl max-w-lg w-full text-center transform scale-100 animate-fade-in-down">
              <h3 className="text-xl sm:text-2xl font-bold text-indigo-700 mb-4">
                Open Demat Account
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Open an account with one of our trusted broker partners.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {brokerLinks.map((broker) => (
                  <a
                    key={broker.name}
                    href={broker.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-gray-100 rounded-xl shadow-inner hover:shadow-lg transition-shadow duration-300 transform hover:scale-105"
                  >
                    <img src={broker.logo} alt={`${broker.name} logo`} className="h-10 w-auto" />
                  </a>
                ))}
              </div>
              <button
                onClick={() => setShowBrokerPopup(false)}
                className="mt-6 bg-red-500 text-white px-4 py-2 rounded-full shadow-md hover:bg-red-600 transition transform hover:scale-105"
              >
                Close
              </button>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
};

export default App;
