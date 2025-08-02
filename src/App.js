import React, { useEffect, useState, useMemo, useCallback } from "react";
import Papa from "papaparse";
import logo from './Track My IPO - Logo.png';

const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSHEORz3aArzaDTOWYW6FlC1avk1TYKAhDKfyALmqg2HMDWiD60N6WG2wgMlPkvLWC9d7YzwplhCStb/pub?output=csv";

const App = () => {
  const [ipoData, setIpoData] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("Initializing...");
  const [viewType, setViewType] = useState("card");
  const [statusFilter, setStatusFilter] = useState("All");

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
  }, []);

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

    if (statusFilter !== "All") {
      items = items.filter((ipo) => ipo.Status?.toLowerCase() === statusFilter.toLowerCase());
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
  }, [ipoData, sortConfig, debouncedSearchTerm, statusFilter]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 text-gray-800">
      {isLoading && (
        <div className="fixed inset-0 bg-gradient-to-br from-blue-600 to-purple-700 text-white flex flex-col items-center justify-center z-50">
          <img src={logo} alt="Logo" className="h-20 w-auto mb-4 rounded-full border border-white" />
          <h2 className="text-4xl font-bold mb-4">Track My IPO</h2>
          <p className="text-xl mb-2">{loadingText}</p>
          <div className="w-64 bg-white bg-opacity-30 rounded-full h-2.5 mb-4">
            <div className="bg-white h-2.5 rounded-full transition-all duration-300" style={{ width: `${loadingProgress}%` }} />
          </div>
          <p className="text-lg font-semibold">{loadingProgress}%</p>
        </div>
      )}

      <header className="p-4 bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow flex flex-wrap gap-2 justify-between items-center sticky top-0 z-30">
        <div className="flex items-center">
          <img src={logo} alt="Logo" className="h-10 w-auto mr-3 rounded-full border border-white" />
          <h1 className="text-xl font-bold">Track My IPO</h1>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="text"
            placeholder="Search IPOs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white text-gray-800 border border-gray-300 p-2 rounded w-40 sm:w-64"
          />
          <select
            className="text-black p-2 rounded border"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>All</option>
            <option>Open</option>
            <option>Closed</option>
            <option>Upcoming</option>
          </select>
          <button onClick={() => setViewType(viewType === 'card' ? 'table' : 'card')} className="bg-white text-blue-600 px-3 py-1 rounded font-semibold">
            {viewType === 'card' ? 'Table View' : 'Card View'}
          </button>
        </div>
      </header>

      <main className="p-4">
        {viewType === 'card' ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
            {filteredSortedIpoData.map((ipo, i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow hover:shadow-md transition border border-gray-200">
                <h2 className="text-lg font-bold text-indigo-700 mb-2">{ipo.Name}</h2>
                <p className="text-sm"><strong>Type:</strong> {ipo.Type}</p>
                <p className="text-sm"><strong>Status:</strong> {ipo.Status}</p>
                <p className="text-sm"><strong>Price:</strong> {ipo.Price}</p>
                <p className="text-sm"><strong>Open:</strong> {ipo.Open} | <strong>Close:</strong> {ipo.Close}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {ipo.Status === "Open - Apply Now" && (
                    <a href={ipo.ApplyURL || "#"} target="_blank" rel="noreferrer" className="px-2 py-1 bg-green-500 text-white rounded">Apply Now</a>
                  )}
                  {ipo.Status?.includes("Allotment Out") && (
                    <a href={ipo.AllotmentLink1 || "#"} target="_blank" rel="noreferrer" className="px-2 py-1 bg-blue-500 text-white rounded">Check Allotment</a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <table className="w-full text-left mt-4 bg-white shadow rounded">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 cursor-pointer" onClick={() => sortBy("Name")}>Name</th>
                <th className="p-2 cursor-pointer" onClick={() => sortBy("Status")}>Status</th>
                <th className="p-2 cursor-pointer" onClick={() => sortBy("Type")}>Type</th>
                <th className="p-2 cursor-pointer" onClick={() => sortBy("Price")}>Price</th>
                <th className="p-2 cursor-pointer" onClick={() => sortBy("GMP")}>GMP</th>
                <th className="p-2 cursor-pointer" onClick={() => sortBy("Subscription")}>Subscription</th>
                <th className="p-2 cursor-pointer" onClick={() => sortBy("IPO Size")}>IPO Size</th>
                <th className="p-2 cursor-pointer" onClick={() => sortBy("Lot")}>Lot</th>
                <th className="p-2 cursor-pointer" onClick={() => sortBy("Open")}>Open</th>
                <th className="p-2 cursor-pointer" onClick={() => sortBy("Close")}>Close</th>
                <th className="p-2 cursor-pointer" onClick={() => sortBy("BoA Dt")}>BoA Dt</th>
                <th className="p-2 cursor-pointer" onClick={() => sortBy("Listing")}>Listing</th>
                <th className="p-2">Apply</th>
                <th className="p-2">Allotment</th>
              </tr>
            </thead>
            <tbody>
              {filteredSortedIpoData.map((ipo, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2 font-medium text-indigo-700">{ipo.Name}</td>
                  <td className="p-2">{ipo.Status}</td>
                  <td className="p-2">{ipo.Type}</td>
                  <td className="p-2">{ipo.Price}</td>
                  <td className="p-2">{ipo.GMP}</td>
                  <td className="p-2">{ipo.Subscription}</td>
                  <td className="p-2">{ipo["IPO Size"]}</td>
                  <td className="p-2">{ipo.Lot}</td>
                  <td className="p-2">{ipo.Open}</td>
                  <td className="p-2">{ipo.Close}</td>
                  <td className="p-2">{ipo["BoA Dt"]}</td>
                  <td className="p-2">{ipo.Listing}</td>
                  <td className="p-2">
                    {ipo.Status === "Open - Apply Now" && (
                      <a href={ipo.ApplyURL || "#"} className="text-green-600" target="_blank" rel="noreferrer">Apply</a>
                    )}
                  </td>
                  <td className="p-2">
                    {ipo.Status?.includes("Allotment Out") && (
                      <a href={ipo.AllotmentLink1 || "#"} className="text-blue-600" target="_blank" rel="noreferrer">Check</a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>

      <footer className="text-center p-4 text-sm text-gray-600">
        <div className="mt-4">
          <a href="/about" className="mr-4 underline">About Us</a>
          <a href="/contact" className="underline">Contact Us</a>
        </div>
        <p className="mt-2">&copy; {new Date().getFullYear()} Track My IPO</p>
      </footer>
    </div>
  );
};

export default App;
