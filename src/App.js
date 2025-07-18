import React, { useEffect, useState } from "react";
import Papa from "papaparse";

const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRlsMurbsXT2UBQ2ADbyoiQtLUTznQU4vNzw3nS02_StSrFV9pkrnXOrNAjV_Yj-Byc_zw72z_rM0tQ/pub?output=csv";;

const App = () => {
  const [ipoData, setIpoData] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [showBrokerPopup, setShowBrokerPopup] = useState(false);
  const [showAllotmentPopup, setShowAllotmentPopup] = useState(false);
  const [allotmentLinks, setAllotmentLinks] = useState([]);

  useEffect(() => {
    Papa.parse(GOOGLE_SHEET_CSV_URL, {
      download: true,
      header: true,
      complete: (result) => {
        setIpoData(result.data);
      },
    });
  }, []);

  const sortBy = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedData = [...ipoData].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aVal = a[sortConfig.key] || "";
    const bVal = b[sortConfig.key] || "";
    if (sortConfig.direction === "asc") {
      return aVal.localeCompare(bVal, undefined, { numeric: true });
    }
    return bVal.localeCompare(aVal, undefined, { numeric: true });
  });

  const headers = [
    "Name", "Type", "Status", "GMP", "Subscription", "Price", "Est Listing",
    "IPO Size", "Lot", "Open", "Close", "BoA Dt", "Listing"
  ];

  const handleApplyClick = () => {
    setShowBrokerPopup(true);
    document.getElementById("broker-section").scrollIntoView({ behavior: 'smooth' });
  };

  const handleAllotmentClick = (ipo) => {
    const links = [
      ipo.AllotmentLink1,
      ipo.AllotmentLink2,
      ipo.AllotmentLink3
    ].filter(Boolean);
    setAllotmentLinks(links);
    setShowAllotmentPopup(true);
  };

  const getStatusContent = (status, ipo) => {
    const cleanStatus = status.toLowerCase();
    if (cleanStatus.includes("apply")) {
      return <span className="text-blue-600 cursor-pointer hover:underline" onClick={handleApplyClick}>🚀 {status}</span>;
    } else if (cleanStatus.includes("pre")) {
      return <span className="text-purple-600">🛒 {status}</span>;
    } else if (cleanStatus.includes("pending")) {
      return <span className="text-yellow-600">🕒 {status}</span>;
    } else if (cleanStatus.includes("allotted")) {
      return <span className="text-green-600 hover:underline cursor-pointer" onClick={() => handleAllotmentClick(ipo)}>✅ {status}</span>;
    } else if (cleanStatus.includes("listed")) {
      return <span className="text-indigo-700">📈 {status}</span>;
    } else {
      return <span className="text-gray-500">📅 {status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 pb-40 font-sans">
      {/* Logo Header with Blue Banner */}
      <header className="bg-blue-700 text-white py-4 px-4 rounded-md shadow mb-6">
  <div className="max-w-5xl mx-auto flex items-start space-x-6">
    <img src="/logo.png" alt="IPO Track Logo" className="w-16 h-16" /> 
    <div>
      <h1 className="text-3xl font-bold">Track My IPO</h1>
      <p className="text-sm text-blue-100">
        Your trusted IPO updates, allotments & Inestment advisery
      </p>
    </div>
  </div>
</header>


      {/* Table Content */}
      <div className="overflow-auto">
        <table className="w-full text-sm bg-white rounded-lg shadow border">
          <thead className="bg-gray-200">
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  onClick={() => sortBy(header)}
                  className="px-3 py-2 cursor-pointer text-left border"
                >
                  {header}
                  <span className={sortConfig.key === header ? "text-black" : "text-gray-400"}>
                    {sortConfig.key === header ? (
                      sortConfig.direction === "asc" ? " ▲" : " ▼"
                    ) : " ⬍"}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((ipo, index) => (
              <tr key={index} className="border-t">
                {headers.map((key) => (
                  <td key={key} className="px-3 py-2 border">
                    {key === "Status"
                      ? getStatusContent(ipo[key], ipo)
                      : key === "GMP"
                      ? <span>{ipo[key]}</span>
                      : ipo[key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
    </div>
 
 
      {/* Allotment Popup */}
      {showAllotmentPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-600 hover:text-black text-lg"
              onClick={() => setShowAllotmentPopup(false)}
            >
              ×
            </button>
            <h3 className="text-lg font-semibold mb-3">Check Allotment Links</h3>
            <ul className="space-y-2">
              {allotmentLinks.map((link, idx) => (
                <li key={idx}>
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    🔗 Check allotment link {idx + 1}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Floating Broker Banner */}
      {showBrokerPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center">
          <div className="bg-white p-4 rounded-lg shadow-lg w-full max-w-3xl relative">
            <button
              onClick={() => setShowBrokerPopup(false)}
              className="absolute top-2 right-2 text-gray-600 hover:text-black text-lg"
            >×</button>
            <h2 className="text-md font-semibold mb-4 text-center">
              🛡️ Open Demat account securely with verified investment brokers.
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              {renderBrokerLinks(true)}
            </div>
          </div>
        </div>
      )}


      {/* Broker Referral Section (Sticky) */}
      <footer id="broker-section" className="fixed bottom-0 left-0 w-full bg-white border-t shadow z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <h2 className="text-md font-semibold mb-2 text-center hover:text-blue-600 transition-all">

        {/* WhatsApp Channel Section */}
<div className="whatsapp-section text-center mb-4">
  <a
    href="https://whatsapp.com/channel/0029VbBPaggaCHaKAwEkOhhf9zdRl34"
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center bg-green-600 text-white px-6 py-2 rounded-full shadow-md hover:bg-green-700 hover:scale-105 transition transform"
  >
    <img
      src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
      alt="WhatsApp"
      className="w-5 h-5 mr-2"
    />
    Get Updates via WhatsApp Channel
  </a>
</div>
            🛡️ Open Demat account securely with verified investment brokers.
          </h2>
          <div className="flex flex-wrap justify-center gap-4 overflow-x-auto pb-2">
            {renderBrokerLinks(false)}
          </div>
        </div>
      </footer>
    </div>
  );

  function renderBrokerLinks(isPopup) {
    const brokers = [
      {
        name: "Zerodha",
        href: "https://zerodha.com/open-account?c=VCB643",
        logo: "https://zerodha.com/static/images/logo.svg",
      },
      {
        name: "Upstox",
        href: "https://upstox.onelink.me/0H1s/4LAYGW",
        logo: "https://assets.upstox.com/website/images/upstox-new-logo.svg",
      },
      {
        name: "Paytm Money",
        href: "https://paytmmoney.page.link/DSwSvdhoasovQYLz9",
        logo: "https://play-lh.googleusercontent.com/nXCY9Did341stoQEhCEH5wJW2FBybZYbpiYl2J-eCajYOXZ_XXXHX1ptjATuA0zayg",
      },
    ];

    return brokers.map((broker, idx) => (
      <a
        key={idx}
        href={broker.href}
        target="_blank"
        onClick={() => console.log(`Clicked ${broker.name}`)}
        className="flex flex-col items-center w-28 text-center hover:scale-105 hover:shadow-lg transition-all p-2 bg-gray-50 rounded-lg"
      >
        <img src={broker.logo} alt={broker.name} className="h-8 mb-1" />
        <span className="text-xs text-gray-600">{broker.name}</span>
      </a>
    ));
  }
};

export default App;
