import React, { useEffect, useState, useMemo, useCallback } from "react";
import Papa from "papaparse"; //check
import logo from './Track My IPO - Logo.png';
import { BrowserRouter as Router, Routes, Route, Link, useParams } from "react-router-dom";

const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSHEORz3aArzaDTOWYW6FlC1avk1TYKAhDKfyALmqg2HMDWiD60N6WG2wgMlPkvLWC9d7YzwplhCStb/pub?output=csv";

// ✅ React Router with filters, dark mode toggle, broker modal


const About = () => (
  <div className="p-6 text-lg max-w-3xl mx-auto">
    <h2 className="text-2xl font-bold mb-4">About Track My IPO</h2>
    <p className="mb-4">
      Track My IPO is your go-to application for staying updated on the latest Initial Public Offerings (IPOs). We aim to provide a simple, intuitive, and efficient way to track IPO statuses, GMP (Grey Market Premium), and other crucial details. Our goal is to empower investors with timely information to make informed decisions.
    </p>
    <p className="mb-4">
      We are continuously working to enhance features and provide the best user experience.
    </p>
    <p className="mb-4">
      Please share your suggestions and comments with us at <a href="mailto:trackmyipo@outlook.com" className="text-blue-600 hover:underline">trackmyipo@outlook.com</a>.
    </p>
    <h3 className="text-xl font-semibold mt-6 mb-2">Disclaimer</h3>
    <p className="text-sm text-gray-700 dark:text-gray-300">
      All content provided on this platform is intended solely for educational and informational purposes. Under no circumstances should any information published here be interpreted as investment advice, a recommendation to buy or sell any securities, or guidance for participating in IPOs.
      We are not registered with SEBI as financial analysts or advisors. Users are strongly advised to consult a qualified financial advisor before making any investment decisions based on the information presented on this platform.
      The content shared is based on publicly available data and prevailing market views as of the date of publication. By using this platform, you acknowledge and agree to these terms and conditions.
    </p>
  </div>
);

const Contact = () => (
  <div className="p-6 text-lg max-w-2xl mx-auto">
    <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
    <p className="mb-4">We'd love to hear from you! To avoid spam and ensure genuine communication, please reach out via email:</p>
    <p className="text-blue-600 underline"><a href="mailto:trackmyipo@outlook.com">trackmyipo@outlook.com</a></p>
    <p className="mt-6 text-sm text-gray-600 dark:text-gray-400">
      Note: We may not respond to unsolicited promotions or automated messages.
    </p>
  </div>
);

const IPOPage = ({ ipoData }) => {
  const { nameSlug } = useParams();
  const ipo = ipoData.find(
    (item) => item.Name?.toLowerCase().replace(/\s+/g, '-') === nameSlug
  );

  if (!ipo) return <div className="p-6 text-red-500">IPO not found.</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{ipo.Name} IPO Details</h1>
      <table className="table-auto w-full text-left">
        <tbody>
          {Object.entries(ipo).map(([key, value]) => (
            <tr key={key} className="border-t">
              <td className="font-medium p-2 w-1/3">{key}</td>
              <td className="p-2">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const Home = () => {
  const [ipoData, setIpoData] = useState([]);
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dark, setDark] = useState(false);

  useEffect(() => {
    Papa.parse(GOOGLE_SHEET_CSV_URL, {
      download: true,
      header: true,
      complete: (result) => {
        const cleaned = result.data.filter(row => row.Name?.trim());
        setIpoData(cleaned);
      }
    });
  }, []);

  const filtered = useMemo(() => {
    return ipoData.filter(item => {
      const statusOk = statusFilter === "All" || item.Status?.toLowerCase().includes(statusFilter.toLowerCase());
      const typeOk = typeFilter === "All" || item.Type?.toLowerCase() === typeFilter.toLowerCase();
      return statusOk && typeOk;
    });
  }, [ipoData, typeFilter, statusFilter]);

  return (
    <div className={`${dark ? 'dark' : ''}`}>
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">IPO Listings</h1>
        <button onClick={() => setDark(!dark)} className="text-sm px-3 py-1 bg-gray-200 dark:bg-gray-800 rounded">
          {dark ? '☀️ Light' : '🌙 Dark'}
        </button>
      </div>
      <div className="mb-4 space-x-2">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="p-2 border">
          <option>All</option>
          <option>Open</option>
          <option>Upcoming</option>
          <option>Listed</option>
        </select>
        <label>
          <input type="radio" name="type" value="All" checked={typeFilter === 'All'} onChange={e => setTypeFilter(e.target.value)} /> All
        </label>
        <label className="ml-2">
          <input type="radio" name="type" value="Mainboard" checked={typeFilter === 'Mainboard'} onChange={e => setTypeFilter(e.target.value)} /> Mainboard
        </label>
        <label className="ml-2">
          <input type="radio" name="type" value="SME" checked={typeFilter === 'SME'} onChange={e => setTypeFilter(e.target.value)} /> SME
        </label>
      </div>
      <ul className="space-y-2">
        {filtered.map((ipo, i) => (
          <li key={i} className="border p-4 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
            <Link to={`/ipo/${ipo.Name?.toLowerCase().replace(/\s+/g, '-')}`} className="text-blue-600 hover:underline">
              {ipo.Name}
            </Link>
            {ipo.Status === "Open - Apply Now" && (
              <div className="mt-2">
                <Link to="/brokers" className="text-green-600 hover:underline text-sm">Apply Now</Link>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

const Brokers = () => (
  <div className="p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold mb-4">Select Your Preferred Broker</h2>
    <ul className="space-y-3">
      {[
        { name: "Zerodha", url: "https://zerodha.com" },
        { name: "Upstox", url: "https://upstox.com" },
        { name: "Angel One", url: "https://angelone.in" }
      ].map((broker, i) => (
        <li key={i} className="bg-white dark:bg-gray-800 p-3 rounded shadow">
          <a href={broker.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
            {broker.name}
          </a>
        </li>
      ))}
    </ul>
  </div>
);

const App = () => {
  const [ipoData, setIpoData] = useState([]);

  useEffect(() => {
    Papa.parse(GOOGLE_SHEET_CSV_URL, {
      download: true,
      header: true,
      complete: (result) => {
        const cleaned = result.data.filter(row => row.Name?.trim());
        setIpoData(cleaned);
      }
    });
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 p-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/ipo/:nameSlug" element={<IPOPage ipoData={ipoData} />} />
          <Route path="/brokers" element={<Brokers />} />
        </Routes>
        <footer className="text-center mt-8 text-sm text-gray-600 dark:text-gray-400">
          <div className="mt-4">
            <Link to="/about" className="mr-4 underline">About Us</Link>
            <Link to="/contact" className="mr-4 underline">Contact Us</Link>
            <Link to="/brokers" className="underline">Brokers</Link>
          </div>
          <p className="mt-2">&copy; {new Date().getFullYear()} Track My IPO</p>
        </footer>
      </div>
    </Router>
  );
};

export default App;
