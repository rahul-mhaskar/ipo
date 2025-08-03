import React, { useEffect, useState, useMemo } from "react";
import Papa from "papaparse";
import logo from "./Track My IPO - Logo.png";
const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSHEORz3aArzaDTOWYW6FlC1avk1TYKAhDKfyALmqg2HMDWiD60N6WG2wgMlPkvLWC9d7YzwplhCStb/pub?output=csv";
const App = () => {
  const [ipoData, setIpoData] = useState([]);
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dark, setDark] = useState(false);

  useEffect(() => {
    Papa.parse(GOOGLE_SHEET_CSV_URL, {
      download: true,
      header: true,
      complete: (result) => {
        const cleaned = result.data.filter((row) => row.Name?.trim());
        setIpoData(cleaned);
      },
    });
  }, []);

  const filtered = useMemo(() => {
    return ipoData.filter((item) => {
      const statusOk =
        statusFilter === "All" ||
        item.Status?.toLowerCase().includes(statusFilter.toLowerCase());
      const typeOk =
        typeFilter === "All" ||
        item.Type?.toLowerCase() === typeFilter.toLowerCase();
      return statusOk && typeOk;
    });
  }, [ipoData, typeFilter, statusFilter]);

  return (
    <div className={`${dark ? "dark" : ""}`}>
      <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 p-4">
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-10 w-10 rounded-full border" />
            <h1 className="text-2xl font-bold">Track My IPO</h1>
          </div>
          <button
            onClick={() => setDark(!dark)}
            className="text-sm px-3 py-1 bg-gray-200 dark:bg-gray-800 rounded"
          >
            {dark ? "☀️ Light" : "🌙 Dark"}
          </button>
        </header>

        <div className="mb-4 space-x-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 border"
          >
            <option>All</option>
            <option>Open</option>
            <option>Upcoming</option>
            <option>Listed</option>
          </select>
          <label>
            <input
              type="radio"
              name="type"
              value="All"
              checked={typeFilter === "All"}
              onChange={(e) => setTypeFilter(e.target.value)}
            />
            All
          </label>
          <label className="ml-2">
            <input
              type="radio"
              name="type"
              value="Mainboard"
              checked={typeFilter === "Mainboard"}
              onChange={(e) => setTypeFilter(e.target.value)}
            />
            Mainboard
          </label>
          <label className="ml-2">
            <input
              type="radio"
              name="type"
              value="SME"
              checked={typeFilter === "SME"}
              onChange={(e) => setTypeFilter(e.target.value)}
            />
            SME
          </label>
        </div>

        <ul className="space-y-2">
          {filtered.map((ipo, i) => (
            <li
              key={i}
              className="border p-4 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <div className="text-lg font-semibold">{ipo.Name}</div>
              <div className="text-sm">Type: {ipo.Type}</div>
              <div className="text-sm">Status: {ipo.Status}</div>
              {ipo.Status === "Open - Apply Now" && (
                <div className="mt-2">
                  <a
                    href="#"
                    onClick={() => alert("Choose broker: Zerodha, Upstox, Angel One")}
                    className="text-green-600 hover:underline text-sm"
                  >
                    Apply Now
                  </a>
                </div>
              )}
              {ipo.Status?.includes("Allotment Out") && ipo.AllotmentLink1 && (
                <div>
                  <a
                    href={ipo.AllotmentLink1}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Check Allotment
                  </a>
                </div>
              )}
            </li>
          ))}
        </ul>

        <footer className="text-center mt-8 text-sm text-gray-600 dark:text-gray-400">
          <div className="mt-4">
            <span className="mr-4 underline cursor-not-allowed">About Us</span>
            <span className="mr-4 underline cursor-not-allowed">Contact Us</span>
            <span className="underline cursor-not-allowed">Brokers</span>
          </div>
          <p className="mt-2">&copy; {new Date().getFullYear()} Track My IPO</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
