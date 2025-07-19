import React, { useEffect, useState, useMemo } from "react";
import Papa from "papaparse";
import "./App.css"; // Make sure Tailwind is imported here

const GOOGLE_SHEET_CSV_URL = 
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSHEORz3aArzaDTOWYW6FlC1avk1TYKAhDKfyALmqg2HMDWiD60N6WG2wgMlPkvLWC9d7YzwplhCStb/pub?gid=0&single=true&output=csv";

function App() {
  const [ipoData, setIpoData] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [showBrokerPopup, setShowBrokerPopup] = useState(false);
  const [showAllotmentPopup, setShowAllotmentPopup] = useState(false);
  const [allotmentLinks, setAllotmentLinks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("");
  const [showMessageBox, setShowMessageBox] = useState(false);
  const [layoutMode, setLayoutMode] = useState("card");
  const [isLoading, setIsLoading] = useState(true);
  const [showUpcomingSection, setShowUpcomingSection] = useState(false);
  const [showCurrentSection, setShowCurrentSection] = useState(true);
  const [showListedSection, setShowListedSection] = useState(false);

  // Message helper
  const showMessage = (msg) => {
    setMessage(msg);
    setShowMessageBox(true);
    setTimeout(() => setShowMessageBox(false), 3000);
  };

  // Fetch and parse CSV
  useEffect(() => {
    setIsLoading(true);
    Papa.parse(GOOGLE_SHEET_CSV_URL, {
      download: true,
      header: true,
      complete: (result) => {
        const cleaned = result.data.filter(row => row.Name?.trim());
        setIpoData(cleaned);
        showMessage(cleaned.length ? "IPO data loaded!" : "No IPO data found.");
        setIsLoading(false);
      },
      error: () => {
        showMessage("Error loading IPO data.");
        setIsLoading(false);
      },
    });
  }, []);

  // Sort helper
  const sortBy = (key) => {
    const direction =
      sortConfig.key === key && sortConfig.direction === "asc"
        ? "desc"
        : "asc";
    setSortConfig({ key, direction });
  };

  // Memoized sorting & filtering
  const { upcomingIpos, currentIpos, listedIpos } = useMemo(() => {
    let items = ipoData.filter((ipo) => {
      const term = searchTerm.toLowerCase();
      return (
        ipo.Name?.toLowerCase().includes(term) ||
        ipo.Status?.toLowerCase().includes(term) ||
        ipo.Type?.toLowerCase().includes(term) ||
        ipo.GMP?.toLowerCase().includes(term) ||
        ipo.Price?.toLowerCase().includes(term)
      );
    });

    if (sortConfig.key) {
      items.sort((a, b) => {
        const aV = a[sortConfig.key] ?? "";
        const bV = b[sortConfig.key] ?? "";
        const numKeys = ["GMP", "Price", "IPO Size", "Lot"];
        if (numKeys.includes(sortConfig.key)) {
          const na = parseFloat(aV.replace(/[^0-9.-]/g, "")) || 0;
          const nb = parseFloat(bV.replace(/[^0-9.-]/g, "")) || 0;
          return sortConfig.direction === "asc" ? na - nb : nb - na;
        }
        return sortConfig.direction === "asc"
          ? aV.localeCompare(bV, undefined, { numeric: true })
          : bV.localeCompare(aV, undefined, { numeric: true });
      });
    }

    const up = [], curr = [], list = [];
    items.forEach((ipo) => {
      const s = ipo.Status?.toLowerCase() ?? "";
      if (s.includes("upcoming") || s.includes("pre-open")) up.push(ipo);
      else if (
        s.includes("apply") ||
        s.includes("open") ||
        s.includes("pending") ||
        s.includes("allotted")
      )
        curr.push(ipo);
      else if (s.includes("listed") || s.includes("closed")) list.push(ipo);
    });

    return { upcomingIpos: up, currentIpos: curr, listedIpos: list };
  }, [ipoData, sortConfig, searchTerm]);

  // **Fix**: combine all for 'card' view
  const displayedIpoData = [
    ...currentIpos,
    ...upcomingIpos,
    ...listedIpos,
  ];

  // Status element generator
  const getStatusContent = (status) => {
    const s = status?.toLowerCase() ?? "";
    if (s.includes("apply"))
      return (
        <span
          className="text-blue-600 cursor-pointer hover:underline font-semibold"
          onClick={() => setShowBrokerPopup(true)}
        >
          🚀 {status}
        </span>
      );
    if (s.includes("pre"))
      return <span className="text-purple-600 font-semibold">🛒 {status}</span>;
    if (s.includes("pending"))
      return <span className="text-yellow-600 font-semibold">🕒 {status}</span>;
    if (s.includes("allotted"))
      return (
        <span
          className="text-green-600 hover:underline cursor-pointer font-semibold"
          onClick={() => setShowAllotmentPopup(true)}
        >
          ✅ {status}
        </span>
      );
    if (s.includes("listed"))
      return <span className="text-indigo-700 font-semibold">📈 {status}</span>;
    return <span className="text-gray-500 font-semibold">📅 {status}</span>;
  };

  // Table headers
  const tableHeaders = [
    "Name",
    "Type",
    "Status",
    "GMP",
    "Subscription",
    "Price",
    "Est Listing",
    "IPO Size",
    "Lot",
    "Open",
    "Close",
    "BoA Dt",
    "Listing",
  ];

  // Table section renderer
  const renderTableSection = (title, list, visible, setter) => (
    <div className="mb-8">
      <div
        className="flex items-center justify-between bg-blue-100 p-3 rounded-t-lg cursor-pointer"
        onClick={() => setter(!visible)}
      >
        <h3 className="text-lg font-semibold text-blue-800">
          {title} ({list.length})
        </h3>
        <span className={visible ? "rotate-0" : "-rotate-90"}>▼</span>
      </div>
      <div
        className={`overflow-hidden transition-all ${
          visible ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {list.length ? (
          <table className="w-full text-sm bg-white rounded-b-lg">
            <thead className="bg-gray-50">
              <tr>
                {tableHeaders.map((h) => (
                  <th
                    key={h}
                    onClick={() => sortBy(h)}
                    className="px-3 py-2 cursor-pointer text-left"
                  >
                    {h}
                    {sortConfig.key === h
                      ? sortConfig.direction === "asc"
                        ? " ▲"
                        : " ▼"
                      : " ⬍"}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((ipo, i) => (
                <tr
                  key={i}
                  className="border-t hover:bg-gray-50"
                >
                  {tableHeaders.map((k) => (
                    <td key={k} className="px-3 py-2">
                      {k === "Status"
                        ? getStatusContent(ipo[k])
                        : ipo[k] || "N/A"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-4 text-center">No IPOs here.</div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-4 shadow">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <svg className="w-10 h-10 mr-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 22h20L12 2zm0 17l-5-10h10l-5 10z" />
            </svg>
            <h1 className="text-3xl font-bold">IPO Tracker</h1>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Search IPOs..."
              className="p-2 rounded bg-white text-gray-800"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              onClick={() =>
                setLayoutMode((m) => (m === "card" ? "table" : "card"))
              }
              className="bg-white text-blue-700 px-4 py-2 rounded font-bold"
            >
              Switch to {layoutMode === "card" ? "Table" : "Card"} View
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto p-4 flex-grow">
        {/* Sort controls */}
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => sortBy("Name")}
            className="bg-blue-500 text-white px-3 py-1 rounded"
          >
            Sort Name {sortConfig.key === "Name" ? (sortConfig.direction === "asc" ? "▲" : "▼") : "⬍"}
          </button>
          <button
            onClick={() => sortBy("Open")}
            className="bg-blue-500 text-white px-3 py-1 rounded"
          >
            Sort Open {sortConfig.key === "Open" ? (sortConfig.direction === "asc" ? "▲" : "▼") : "⬍"}
          </button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="text-center py-8 text-gray-600">Loading IPO data...</div>
        )}

        {/* Card view */}
        {layoutMode === "card" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedIpoData.length ? (
              displayedIpoData.map((ipo, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold text-blue-700 mb-2">
                    {ipo.Name} ({ipo.Type})
                  </h2>
                  <p><strong>Price:</strong> {ipo.Price || "N/A"}</p>
                  <p><strong>Lot:</strong> {ipo.Lot || "N/A"}</p>
                  <p><strong>Open:</strong> {ipo.Open || "N/A"}</p>
                  <p><strong>Close:</strong> {ipo.Close || "N/A"}</p>
                  <div className="flex justify-between items-center mt-4">
                    {getStatusContent(ipo.Status)}
                    <button
                      onClick={() => showMessage(`Details for ${ipo.Name}`)}
                      className="bg-blue-500 text-white px-4 py-2 rounded"
                    >
                      Details
                    </button>
                  </div>
                </div>
              ))
            ) : (
              !isLoading && <div className="text-center">No IPOs found.</div>
            )}
          </div>
        ) : (
          <>
            {renderTableSection(
              "Current IPOs (Open & Awaiting Allotment)",
              currentIpos,
              showCurrentSection,
              setShowCurrentSection
            )}
            {renderTableSection(
              "Upcoming IPOs",
              upcomingIpos,
              showUpcomingSection,
              setShowUpcomingSection
            )}
            {renderTableSection(
              "Listed/Closed IPOs",
              listedIpos,
              showListedSection,
              setShowListedSection
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 w-full bg-white border-t p-2 flex justify-center space-x-4">
        <button
          className="text-green-600 flex items-center"
          onClick={() => window.open("https://whatsapp.com/channel/0029VbBPaggaCHaKAwEkOhhf9zdRl34", "_blank")}
        >
          📱 WhatsApp Updates
        </button>
      </footer>

      {/* Popups + Message Box */}
      {showBrokerPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow">
            <button
              className="absolute top-2 right-2"
              onClick={() => setShowBrokerPopup(false)}
            >
              ×
            </button>
            <p>Select your broker...</p>
          </div>
        </div>
      )}

      {showAllotmentPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow">
            <button
              className="absolute top-2 right-2"
              onClick={() => setShowAllotmentPopup(false)}
            >
              ×
            </button>
            <p>Allotment links go here...</p>
          </div>
        </div>
      )}

      {showMessageBox && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded shadow text-center">
            <p>{message}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
