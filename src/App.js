// ✅ Optimized, Enhanced Version (Mobile-First, Vibrant UI)

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Papa from "papaparse";
import websiteLogo from './Track My IPO - Logo.png';

const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSHEORz3aArzaDTOWYW6FlC1avk1TYKAhDKfyALmqg2HMDWiD60N6WG2wgMlPkvLWC9d7YzwplhCStb/pub?output=csv";
const WEBSITE_LOGO_URL = websiteLogo;

const App = () => {
  const [ipoData, setIpoData] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("Initializing...");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    let progressInterval;
    let currentProgress = 0;

    const startProgressSimulation = () => {
      progressInterval = setInterval(() => {
        currentProgress = Math.min(currentProgress + Math.random() * 10, 95);
        setLoadingProgress(Math.floor(currentProgress));
        setLoadingText(
          currentProgress < 30
            ? "Connecting to data source..."
            : currentProgress < 70
            ? "Fetching IPO records..."
            : "Processing data..."
        );
      }, 200);
    };

    setIsLoading(true);
    setLoadingProgress(0);
    setLoadingText("Loading IPO data...");
    startProgressSimulation();

    Papa.parse(GOOGLE_SHEET_CSV_URL, {
      download: true,
      header: true,
      complete: (result) => {
        clearInterval(progressInterval);
        const cleanedData = result.data.filter(row => row.Name?.trim());
        setIpoData(cleanedData);
        setLoadingProgress(100);
        setLoadingText("Data loaded successfully!");
        setTimeout(() => setIsLoading(false), 300);
      },
      error: (error) => {
        clearInterval(progressInterval);
        setLoadingText("Error loading data");
        setTimeout(() => setIsLoading(false), 2000);
        console.error("CSV Error:", error);
      }
    });

    return () => clearInterval(progressInterval);
  }, [refreshTrigger]);

  const sortBy = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  }, []);

  const parseDateForSort = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date) ? null : date;
  };

  const filteredSortedIpoData = useMemo(() => {
    let items = [...ipoData];
    const term = debouncedSearchTerm.toLowerCase();

    if (term) {
      items = items.filter((ipo) =>
        ["Name", "Status", "Type", "GMP", "Price", "Description"].some(
          (field) => ipo[field]?.toLowerCase().includes(term)
        )
      );
    }

    if (sortConfig.key) {
      items.sort((a, b) => {
        const aVal = a[sortConfig.key] || "";
        const bVal = b[sortConfig.key] || "";
        const numericKeys = ["GMP", "Price", "IPO Size", "Lot"];
        const dateKeys = ["Open", "Close", "BoA Dt", "Listing"];

        if (numericKeys.includes(sortConfig.key)) {
          const numA = parseFloat(aVal.replace(/[^0-9.-]/g, ""));
          const numB = parseFloat(bVal.replace(/[^0-9.-]/g, ""));
          return sortConfig.direction === "asc" ? numA - numB : numB - numA;
        }

        if (dateKeys.includes(sortConfig.key)) {
          const dateA = parseDateForSort(aVal);
          const dateB = parseDateForSort(bVal);
          if (!dateA || !dateB) return !dateA ? 1 : -1;
          return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
        }

        return sortConfig.direction === "asc"
          ? aVal.localeCompare(bVal, undefined, { numeric: true })
          : bVal.localeCompare(aVal, undefined, { numeric: true });
      });
    }
    return items;
  }, [ipoData, sortConfig, debouncedSearchTerm]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 text-gray-800">
      {isLoading && (
        <div className="fixed inset-0 bg-gradient-to-br from-blue-600 to-purple-700 text-white flex flex-col items-center justify-center z-50">
          <svg className="animate-spin h-16 w-16 text-white mb-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <h2 className="text-4xl font-bold mb-4">Track My IPO</h2>
          <p className="text-xl mb-2">{loadingText}</p>
          <div className="w-64 bg-white bg-opacity-30 rounded-full h-2.5 mb-4">
            <div className="bg-white h-2.5 rounded-full transition-all duration-300" style={{ width: `${loadingProgress}%` }} />
          </div>
          <p className="text-lg font-semibold">{loadingProgress}%</p>
        </div>
      )}

      <header className="p-4 bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center">
          <img
            src={WEBSITE_LOGO_URL}
            alt="Logo"
            className="h-10 w-10 object-contain mr-3 rounded-full border border-white"
            onError={(e) => (e.target.src = "https://placehold.co/40x40")}
          />
          <h1 className="text-xl font-bold">Track My IPO</h1>
        </div>
        <input
          type="text"
          placeholder="Search IPOs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-white text-gray-800 border border-gray-300 p-2 rounded w-48 sm:w-64"
        />
      </header>

      <main className="p-4 grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        {filteredSortedIpoData.map((ipo, i) => (
          <div
            key={i}
            className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition duration-300 border border-gray-200"
          >
            <h2 className="text-lg font-bold text-indigo-700 mb-2">{ipo.Name}</h2>
            <p className="text-sm"><span className="font-semibold text-gray-600">Type:</span> {ipo.Type}</p>
            <p className="text-sm"><span className="font-semibold text-gray-600">Status:</span> {ipo.Status}</p>
            <p className="text-sm"><span className="font-semibold text-gray-600">Price:</span> {ipo.Price}</p>
            <p className="text-sm"><span className="font-semibold text-gray-600">Open:</span> {ipo.Open} | <span className="font-semibold text-gray-600">Close:</span> {ipo.Close}</p>
          </div>
        ))}
      </main>

      <div className="fixed bottom-4 right-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg p-3 rounded-xl flex gap-2">
        <button
          className="px-3 py-1 rounded bg-white text-blue-600 font-semibold hover:bg-blue-100"
          onClick={() => sortBy("Name")}
        >
          Sort by Name
        </button>
        <button
          className="px-3 py-1 rounded bg-white text-blue-600 font-semibold hover:bg-blue-100"
          onClick={() => sortBy("Open")}
        >
          Sort by Open
        </button>
      </div>
    </div>
  );
};

export default App;
