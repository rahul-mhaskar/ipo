import React, { useEffect, useState } from "react";
import Papa from "papaparse";

const GOOGLE_SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRlsMurbsXT2UBQ2ADbyoiQtLUTznQU4vNzw3nS02_StSrFV9pkrnXOrNAjV_Yj-Byc_zw72z_rM0tQ/pub?output=csv";

const App = () => {
  const [ipoData, setIpoData] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

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
    "Name", "Type", "GMP", "Subscription", "Price", "Est Listing",
    "IPO Size", "Lot", "Open dt", "Close dt", "BoA Dt", "Listing dt", "Status"
  ];

  const getStatusContent = (status) => {
    const cleanStatus = status.toLowerCase();
    if (cleanStatus.includes("apply")) {
      return <span className="text-blue-600 cursor-pointer hover:underline" onClick={() => document.getElementById("broker-section").scrollIntoView({ behavior: 'smooth' })}>🚀 {status}</span>;
    } else if (cleanStatus.includes("pre")) {
      return <span className="text-purple-600">🛒 {status}</span>;
    } else if (cleanStatus.includes("pending")) {
      return <span className="text-yellow-600">🕒 {status}</span>;
    } else if (cleanStatus.includes("allotted")) {
      return <a href="https://ipoallotmentlink.com" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">✅ {status}</a>;
    } else if (cleanStatus.includes("listed")) {
      return <span className="text-indigo-700">📈 {status}</span>;
    } else {
      return <span className="text-gray-500">📅 {status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 pb-40 font-sans">
      <h1 className="text-3xl font-bold text-center mb-6">IPO Track</h1>

      <div className="overflow-auto">
        <table className="w-full text-sm bg-white rounded-lg shadow">
          <thead className="bg-gray-200">
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  onClick={() => sortBy(header)}
                  className="px-3 py-2 cursor-pointer text-left"
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
                  <td key={key} className="px-3 py-2">
                    {key === "Status" ? getStatusContent(ipo[key]) :
                      key === "GMP"
                        ? <span className={parseFloat(ipo[key]) > 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>{ipo[key]}</span>
                        : ipo[key]}
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

      {/* Broker Referral Section (Sticky) */}
      <footer id="broker-section" className="fixed bottom-0 left-0 w-full bg-white border-t shadow z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <h2 className="text-md font-semibold mb-2 text-center">
            Open Account via Our Referral Links
          </h2>
          <div className="flex flex-wrap justify-center gap-4 overflow-x-auto pb-2">
            <a href="https://zerodha.com/open-account?ref=YOUR_REF" target="_blank" className="flex flex-col items-center w-28 text-center hover:opacity-80">
              <img src="https://zerodha.com/static/images/logo.svg" alt="Zerodha" className="h-8 mb-1" />
              <span className="text-xs text-gray-600">Zerodha</span>
            </a>

            <a href="https://upstox.com/open-account/?f=YOUR_REF" target="_blank" className="flex flex-col items-center w-28 text-center hover:opacity-80">
              <img src="https://assets-netstorage.groww.in/brokers/logos/UPSTOX.png" alt="Upstox" className="h-8 mb-1" />
              <span className="text-xs text-gray-600">Upstox</span>
            </a>

            <a href="https://groww.in/ref/YOUR_REF" target="_blank" className="flex flex-col items-center w-28 text-center hover:opacity-80">
              <img src="https://groww.in/static/favicon/apple-touch-icon.png" alt="Groww" className="h-8 mb-1" />
              <span className="text-xs text-gray-600">Groww</span>
            </a>

            <a href="https://angelone.onelink.me/YOUR_REF" target="_blank" className="flex flex-col items-center w-28 text-center hover:opacity-80">
              <img src="https://play-lh.googleusercontent.com/angleone-logo" alt="Angel One" className="h-8 mb-1" />
              <span className="text-xs text-gray-600">Angel One</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
