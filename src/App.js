// ✅ Optimized, Enhanced Version (Card/Table Toggle, Sorting, View Segregation)

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Papa from "papaparse";
import logo from './Track My IPO - Logo.png';

const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSHEORz3aArzaDTOWYW6FlC1avk1TYKAhDKfyALmqg2HMDWiD60N6WG2wgMlPkvLWC9d7YzwplhCStb/pub?output=csv";

const App = () => {
  const [ipoData, setIpoData] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [searchTerm, setSearchTerm] = useState("");
  const [viewType, setViewType] = useState("table");

  useEffect(() => {
    Papa.parse(GOOGLE_SHEET_CSV_URL, {
      download: true,
      header: true,
      complete: (result) => {
        const cleanedData = result.data.filter(row => row.Name?.trim());
        setIpoData(cleanedData);
      },
      error: (error) => console.error("CSV Error:", error)
    });
  }, []);

  const sortBy = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  const sortedData = useMemo(() => {
    const data = [...ipoData];
    if (sortConfig.key) {
      data.sort((a, b) => {
        const aVal = a[sortConfig.key] || "";
        const bVal = b[sortConfig.key] || "";
        return sortConfig.direction === "asc"
          ? aVal.localeCompare(bVal, undefined, { numeric: true })
          : bVal.localeCompare(aVal, undefined, { numeric: true });
      });
    }
    return data;
  }, [ipoData, sortConfig]);

  const categorized = useMemo(() => {
    return {
      current: sortedData.filter(i => i.Status !== "Upcoming" && !i.Status.startsWith("Listed")),
      upcoming: sortedData.filter(i => i.Status === "Upcoming"),
      listed: sortedData.filter(i => i.Status.startsWith("Listed"))
    };
  }, [sortedData]);

  const renderTable = (data, label) => (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-indigo-700 mb-2">{label}</h2>
      <table className="w-full text-left bg-white shadow rounded mb-4">
        <thead className="bg-gray-100">
          <tr>
            {['Name','Subscription','Price','GMP','Est Listing','IPO Size','Lot','Open','Close','BoA Dt','Listing','Type','Status'].map(col => (
              <th key={col} className="p-2 cursor-pointer" onClick={() => sortBy(col)}>
                {col} {sortConfig.key === col && (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((ipo, i) => (
            <tr key={i} className="border-t">
              <td className="p-2">{ipo.Name}</td>
              <td className="p-2">{ipo.Subscription}</td>
              <td className="p-2">{ipo.Price}</td>
              <td className="p-2">{ipo.GMP}</td>
              <td className="p-2">{ipo["Est Listing"]}</td>
              <td className="p-2">{ipo["IPO Size"]}</td>
              <td className="p-2">{ipo.Lot}</td>
              <td className="p-2">{ipo.Open}</td>
              <td className="p-2">{ipo.Close}</td>
              <td className="p-2">{ipo["BoA Dt"]}</td>
              <td className="p-2">{ipo.Listing}</td>
              <td className="p-2">{ipo.Type}</td>
              <td className="p-2">{ipo.Status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="p-4">
      <header className="mb-6 flex justify-between items-center">
        <div className="flex items-center">
          <img src={logo} alt="Logo" className="h-10 w-10 rounded-full mr-3" />
          <h1 className="text-2xl font-bold text-blue-600">Track My IPO</h1>
        </div>
        <input
          type="text"
          placeholder="Search..."
          className="p-2 border rounded"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </header>

      {renderTable(categorized.current, "Current IPOs")}
      {renderTable(categorized.upcoming, "Upcoming IPOs")}
      {renderTable(categorized.listed, "Closed & Listed IPOs")}
    </div>
  );
};

export default App;
