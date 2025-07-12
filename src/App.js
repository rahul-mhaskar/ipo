
import React, { useEffect, useState } from "react";
import Papa from "papaparse";

const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRlsMurbsXT2UBQ2ADbyoiQtLUTznQU4vNzw3nS02_StSrFV9pkrnXOrNAjV_Yj-Byc_zw72z_rM0tQ/pub?output=csv"; // Replace with your link

const headers = [
  "Name", "Subscription", "Price", "Est Listing", "IPO Size", "Lot", 
  "Open dt", "Close dt", "BoA Dt", "Listing dt", "Type", "GMP", "Allotment Link"
];

const App = () => {
  const [ipoData, setIpoData] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  useEffect(() => {
    Papa.parse(GOOGLE_SHEET_CSV_URL, {
      download: true,
      header: true,
      complete: (results) => setIpoData(results.data),
    });
  }, []);

  const sortTable = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = [...ipoData].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aVal = a[sortConfig.key] || "";
    const bVal = b[sortConfig.key] || "";
    return sortConfig.direction === 'asc'
      ? aVal.localeCompare(bVal)
      : bVal.localeCompare(aVal);
  });

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold text-indigo-700">IPO Track</h1>
        <p className="text-gray-600">Track upcoming, ongoing, and past IPOs</p>
      </header>

      <div className="overflow-auto">
        <table className="min-w-full bg-white shadow-md rounded-xl">
          <thead className="bg-indigo-100">
            <tr>
              {headers.map((key) => (
                <th key={key} onClick={() => sortTable(key)} className="p-2 cursor-pointer text-sm">
                  {key} {sortConfig.key === key ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '▲▼'}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, idx) => (
              <tr key={idx} className="even:bg-gray-50 text-sm">
                {headers.map((key) => (
                  <td key={key} className="p-2 text-center">
                    {key === "GMP" ? (
                      <span className={parseInt(row[key]) >= 0 ? "text-green-600" : "text-red-600"}>{row[key]}</span>
                    ) : key === "Allotment Link" ? (
                      <a href={row[key]} target="_blank" rel="noreferrer" className="text-blue-600 underline">Check</a>
                    ) : (
                      row[key]
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="mt-8 text-center">
        <h2 className="text-xl font-semibold mb-2">Join Our WhatsApp Group</h2>
        <a
          href="https://chat.whatsapp.com/YOUR_LINK_HERE"
          target="_blank"
          className="inline-block bg-green-500 text-white px-6 py-2 rounded-xl hover:bg-green-600"
        >
          Join Now
        </a>
      </section>

      <section className="mt-8">
  <h2 className="text-xl font-semibold mb-4 text-center">Open Account via Our Referral Links</h2>
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    
    <a href="https://zerodha.com/open-account?ref=YOUR_REF" target="_blank" className="block bg-white rounded-xl shadow hover:shadow-lg p-4 text-center">
      <img src="https://zerodha.com/static/images/logo.svg" alt="Zerodha" className="mx-auto h-12 mb-2" />
      <p className="text-sm text-gray-600">Zerodha – India's #1 broker</p>
    </a>

    <a href="https://upstox.onelink.me/0H1s/4LAYGW" target="_blank" className="block bg-white rounded-xl shadow hover:shadow-lg p-4 text-center">
      <img src="https://assets-netstorage.groww.in/brokers/logos/UPSTOX.png" alt="Upstox" className="mx-auto h-12 mb-2" />
      <p className="text-sm text-gray-600">Upstox – Fast & Easy Account</p>
    </a>

    <a href="https://groww.in/ref/YOUR_REF" target="_blank" className="block bg-white rounded-xl shadow hover:shadow-lg p-4 text-center">
      <img src="https://groww.in/static/favicon/apple-touch-icon.png" alt="Groww" className="mx-auto h-12 mb-2" />
      <p className="text-sm text-gray-600">Groww – Invest in Stocks & Mutual Funds</p>
    </a>

    <a href="https://angelone.onelink.me/YOUR_REF" target="_blank" className="block bg-white rounded-xl shadow hover:shadow-lg p-4 text-center">
      <img src="https://play-lh.googleusercontent.com/angleone-logo" alt="Angel One" className="mx-auto h-12 mb-2" />
      <p className="text-sm text-gray-600">Angel One – Full-service broker</p>
    </a>
    
  </div>
</section>


      <footer className="mt-12 text-center text-gray-400 text-sm">
        &copy; {new Date().getFullYear()} IPO Track. All rights reserved.
      </footer>
    </div>
  );
};

export default App;
