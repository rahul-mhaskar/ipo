import React, { useEffect, useState } from 'react';
import { Card, CardContent } from './components/ui/card';
import { Input } from './components/ui/input';
import { Switch } from './components/ui/switch';
import { Sun, Moon } from 'lucide-react';

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRlsMurbsXT2UBQ2ADbyoiQtLUTznQU4vNzw3nS02_StSrFV9pkrnXOrNAjV_Yj-Byc_zw72z_rM0tQ/pub?output=csv';

export default function IPODashboard() {
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    fetch(SHEET_URL)
      .then(res => res.text())
      .then(text => {
        const rows = text.split('\n').map(r => r.split(','));
        const headers = rows[0];
        const entries = rows.slice(1).map(row => Object.fromEntries(row.map((cell, i) => [headers[i], cell])));
        setData(entries);
      });
  }, []);

  const filtered = data.filter(item => {
    const nameMatch = item.Name?.toLowerCase().includes(search.toLowerCase());
    const filterMatch = filter === 'All' || item.Status?.includes(filter);
    return nameMatch && filterMatch;
  });

  return (
    <div className={darkMode ? 'bg-gray-900 text-white min-h-screen' : 'bg-gray-50 text-black min-h-screen'}>
      <header className="p-4 shadow bg-white dark:bg-gray-800 sticky top-0 z-10 backdrop-blur bg-opacity-80 dark:bg-opacity-80 border-b dark:border-gray-700 flex justify-between items-center">
        <h1 className="text-2xl font-bold">IPO Tracker</h1>
        <div className="flex gap-4 items-center">
          <Input placeholder="Search IPOs..." value={search} onChange={e => setSearch(e.target.value)} className="w-60" />
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="rounded px-3 py-2 border bg-white dark:bg-gray-700 dark:border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option>All</option>
            <option>Open</option>
            <option>Upcoming</option>
            <option>Listed</option>
            <option>Allotted</option>
          </select>
          <Switch checked={darkMode} onCheckedChange={setDarkMode} />
          {darkMode ? <Moon /> : <Sun />}
        </div>
      </header>

      <main className="grid gap-6 p-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 animate-fadeIn">
        {filtered.map((ipo, i) => (
          <Card
            key={i}
            className="shadow hover:shadow-xl transition duration-300 border border-gray-200 dark:border-gray-700 hover:scale-[1.02]"
          >
            {ipo.Image && (
              <img src={ipo.Image} alt={ipo.Name} className="w-full h-32 object-contain p-2" />
            )}
            <CardContent className="space-y-1">
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-lg">{ipo.Name}</h2>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    ipo.Type === 'Mainboard'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {ipo.Type}
                </span>
              </div>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  ipo.Status === 'Open'
                    ? 'bg-green-200 text-green-800'
                    : ipo.Status === 'Upcoming'
                    ? 'bg-yellow-200 text-yellow-800'
                    : ipo.Status === 'Listed'
                    ? 'bg-blue-200 text-blue-800'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {ipo.Status}
              </span>
              <div className="text-sm">📈 GMP: {ipo.GMP || 'N/A'}</div>
              <div className="text-sm">💰 Price: {ipo.Price}</div>
              <div className="text-sm">🧮 Est Listing: {ipo['Est Listing']}</div>
              <div className="text-sm">📦 Lot: {ipo.Lot} | Size: {ipo['IPO Size']}</div>
              <div className="text-sm">📅 {ipo.Open} - {ipo.Close}</div>
              <div className="text-sm">🗓️ BoA: {ipo['BoA Dt']} | 📜 Listing: {ipo.Listing}</div>
              {ipo.AllotmentLink1 && (
                <a
                  href={ipo.AllotmentLink1}
                  className="block mt-2 text-blue-600 dark:text-blue-400 text-sm underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  🔗 Check Allotment
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </main>

      <footer className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
        IPO data auto-updated from Google Sheets. Not financial advice. | © 2025
      </footer>
    </div>
  );
}
