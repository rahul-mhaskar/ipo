import React, { useEffect, useState } from "react";
import Papa from "papaparse";

const GOOGLE_SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRlsMurbsXT2UBQ2ADbyoiQtLUTznQU4vNzw3nS02_StSrFV9pkrnXOrNAjV_Yj-Byc_zw72z_rM0tQ/pub?output=csv";

const App = () => {
  const [ipoData, setIpoData] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [showBrokerPopup, setShowBrokerPopup] = useState(false);
  const [showAllotmentPopup, setShowAllotmentPopup] = useState(false);
  const [currentAllotmentLinks, setCurrentAllotmentLinks] = useState([]);

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
    "IPO Size", "Lot", "Open dt", "Close dt", "BoA Dt", "Listing dt"
  ];

  const getStatusContent = (status, ipo) => {
    const cleanStatus = status.toLowerCase();
    if (cleanStatus.includes("apply")) {
      return <span className="text-blue-600 cursor-pointer hover:underline" onClick={() => setShowBrokerPopup(true)}>🚀 {status}</span>;
    } else if (cleanStatus.includes("pre")) {
      return <span className="text-purple-600">🛒 {status}</span>;
    } else if (cleanStatus.includes("pending")) {
      return <span className="text-yellow-600">🕒 {status}</span>;
    } else if (cleanStatus.includes("allotted")) {
      return <span className="text-green-600 cursor-pointer hover:underline" onClick={() => handleAllotmentClick(ipo)}>✅ {status}</span>;
    } else if (cleanStatus.includes("listed")) {
      return <span className="text-indigo-700">📈 {status}</span>;
    } else {
      return <span className="text-gray-500">📅 {status}</span>;
    }
  };

  const handleAllotmentClick = (ipo) => {
    const links = [
      ipo.AllotmentLink1,
      ipo.AllotmentLink2,
      ipo.AllotmentLink3
    ].filter(Boolean);
    setCurrentAllotmentLinks(links);
    setShowAllotmentPopup(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 pb-40 font-sans">
      <h1 className="text-3xl font-bold text-center mb-6">IPO Track</h1>

      <div className="overflow-auto rounded border border-gray-300">
        <table className="w-full text-sm bg-white rounded-lg">
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
                    {key === "Status" ? getStatusContent(ipo[key], ipo) : ipo[key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* WhatsApp Group */}
      <div className="mt-6 text-center">
        <a
          href="https://chat.whatsapp.com/YOUR_WHATSAPP_GROUP_LINK"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-green-600 text-white px-6 py-2 rounded-full shadow hover:bg-green-700"
        >
          📱 Join Our WhatsApp Group
        </a>
      </div>

      {/* Floating Broker Popup */}
      {showBrokerPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center">
          <div className="bg-white rounded-lg p-4 shadow-lg max-w-lg w-full">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-md font-semibold">🛡️ Apply securely by verified investment brokers.</h2>
              <button onClick={() => setShowBrokerPopup(false)} className="text-xl font-bold">×</button>
            </div>
            <div className="flex flex-wrap justify-center gap-4 overflow-x-auto">
              {renderBrokers(true)}
            </div>
          </div>
        </div>
      )}

      {/* Floating Allotment Popup */}
      {showAllotmentPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
          <div className="bg-white rounded-lg p-4 shadow-lg max-w-md w-full">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-md font-semibold">📤 Check Allotment Links</h2>
              <button onClick={() => setShowAllotmentPopup(false)} className="text-xl font-bold">×</button>
            </div>
            <ul className="list-disc ml-4">
              {currentAllotmentLinks.map((link, idx) => (
                <li key={idx}>
                  <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Allotment Page {idx + 1}
                  </a>
                </li>
              ))}
            </ul>
            <p className="text-sm text-gray-500 mt-3">Tap outside or click × to close</p>
          </div>
        </div>
      )}

      {/* Broker Referral Section (Sticky) */}
      <footer id="broker-section" className="fixed bottom-0 left-0 w-full bg-white border-t shadow z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <h2 className="text-sm font-semibold text-center hover:scale-105 transition-transform">
            🛡️ Open Demat account securely with verified investment brokers.
          </h2>
          <div className="flex flex-wrap justify-center gap-4 overflow-x-auto pt-2">
            {renderBrokers(false)}
          </div>
        </div>
      </footer>
    </div>
  );

  function renderBrokers(isPopup) {
    return (
      [
        {
          name: "Zerodha",
          href: "https://zerodha.com/open-account?ref=YOUR_REF",
          img: "https://zerodha.com/static/images/logo.svg",
        },
        {
          name: "Upstox",
          href: "https://upstox.com/open-account/?f=YOUR_REF",
          img: "https://assets-netstorage.groww.in/brokers/logos/UPSTOX.png",
        },
        {
          name: "Groww",
          href: "https://groww.in/ref/YOUR_REF",
          img: "https://groww.in/static/favicon/apple-touch-icon.png",
        },
        {
          name: "Angel One",
          href: "https://angelone.onelink.me/YOUR_REF",
          img: "https://play-lh.googleusercontent.com/angleone-logo",
        },
      ].map((broker, idx) => (
        <a
          key={idx}
          href={broker.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center w-28 text-center p-3 rounded-lg shadow hover:shadow-lg hover:scale-105 transition-transform bg-gray-50"
          onClick={() => console.log(`Broker clicked: ${broker.name}`)}
        >
          <img src={broker.img} alt={broker.name} className="h-8 mb-1" />
          <span className="text-xs text-gray-700">{broker.name}</span>
        </a>
      ))
    );
  }
};

export default App;
