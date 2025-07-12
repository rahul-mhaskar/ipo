
import React, { useEffect, useState } from "react";
import Papa from "papaparse";

const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/PASTE_YOUR_LINK_HERE/pub?output=csv"; // Replace with your link

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
        <h2 className="text-xl font-semibold mb-4 text-center">Download Stock Broker Apps</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <a href="https://zerodha.com/open-account" className="bg-white shadow p-4 text-center rounded-xl hover:shadow-lg">Zerodha</a>
          <a href="https://upstox.com/open-account" className="bg-white shadow p-4 text-center rounded-xl hover:shadow-lg">Upstox</a>
          <a href="https://groww.in" className="bg-white shadow p-4 text-center rounded-xl hover:shadow-lg">Groww</a>
          <a href="https://angelone.in" className="bg-white shadow p-4 text-center rounded-xl hover:shadow-lg">Angel One</a>
        </div>
      </section>

      <footer className="mt-12 text-center text-gray-400 text-sm">
        &copy; {new Date().getFullYear()} IPO Track. All rights reserved.
      </footer>
    </div>
  );
};

export default App;
