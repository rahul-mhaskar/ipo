// ✅ Optimized, Enhanced, and Animated Single-File Version
// Assumes you have installed: npm install framer-motion

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { motion } from "framer-motion";
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

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Progress splash screen and data fetching
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
    <div className="min-h-screen bg-gradient-to-br from-sky-100 to-indigo-100 text-gray-800">
      {/* Splash Screen */}
      {isLoading && (
        <div className="fixed inset-0 bg-gradient-to-br from-blue-600 to-purple-700 text-white flex flex-col items-center justify-center z-50">
          <svg className="animate-spin h-16 w-16 text-white mb-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <h2 className="text-4xl font-bold mb-4">Track My IPO</h2>
          <p className="text-xl mb-2">{loadingText}</p>
          <div className="w-64 bg-white bg-opacity-30 rounded-full h-2.5 mb-4">
            <motion.div
              className="bg-white h-2.5 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${loadingProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-lg font-semibold">{loadingProgress}%</p>
        </div>
      )}

      {/* Header */}
      <header className="p-4 bg-white shadow flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center">
          <img
            src={WEBSITE_LOGO_URL}
            alt="Logo"
            className="h-10 w-10 object-contain mr-3"
            onError={(e) => (e.target.src = "https://placehold.co/40x40")}
          />
          <h1 className="text-xl font-bold">Track My IPO</h1>
        </div>
        <input
          type="text"
          placeholder="Search IPOs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border p-2 rounded w-64"
        />
      </header>

      {/* Content */}
      <main className="p-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredSortedIpoData.map((ipo, i) => (
          <motion.div
            key={i}
            className="bg-white rounded-lg p-4 shadow hover:shadow-md transition"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.03 }}
          >
            <h2 className="text-lg font-semibold mb-2">{ipo.Name}</h2>
            <p className="text-sm"><strong>Type:</strong> {ipo.Type}</p>
            <p className="text-sm"><strong>Status:</strong> {ipo.Status}</p>
            <p className="text-sm"><strong>Price:</strong> {ipo.Price}</p>
            <p className="text-sm"><strong>Open:</strong> {ipo.Open} | <strong>Close:</strong> {ipo.Close}</p>
          </motion.div>
        ))}
      </main>

      {/* Sort Controls */}
      <div className="fixed bottom-4 right-4 bg-white shadow-lg p-3 rounded-lg flex gap-2">
        <button
          className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
          onClick={() => sortBy("Name")}
        >
          Sort by Name
        </button>
        <button
          className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
          onClick={() => sortBy("Open")}
        >
          Sort by Open
        </button>
      </div>
    </div>
  );
};

export default App;
