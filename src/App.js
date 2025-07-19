import React, { useEffect, useState } from 'react';

import { Card } from "./components/ui/card";

import { Input } from "./components/ui/input";
import { Switch } from "./components/ui/switch";


import { Sun, Moon } from 'lucide-react';

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRlsMurbsXT2UBQ2ADbyoiQtLUTznQU4vNzw3nS02_StSrFV9pkrnXOrNAjV_Yj-Byc_zw72z_rM0tQ/pub?output=csv'; // Replace with your CSV link 

export default function IPODashboard() {
  const [data, setData] = useState([]);
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
    <div className={darkMode ? "bg-gray-900 text-white min-h-screen" : "bg-gray-50 text-black min-h-screen"}>
      <header className="p-4 shadow bg-white dark:bg-gray-800 flex justify-between items-center">
        <h1 className="text-2xl font-bold">IPO Tracker</h1>
        <div className="flex gap-4 items-center">
          <Input
            placeholder="Search IPOs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-60"
          />
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="rounded px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
          >
            <option>All</option>
            <option>Open</option>
            <option>Upcoming</option>
            <option>Listed</option>
            <option>Allotted</option>
          </select>
          <Switch
            checked={darkMode}
            onCheckedChange={setDarkMode}
          />
          {darkMode ? <Moon /> : <Sun />}
        </div>
      </header>

      <main className="grid gap-4 p-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {filtered.map((ipo, i) => (
          <Card key={i} className="shadow hover:shadow-lg transition">
            {ipo.Image && (
              <img
                src={ipo.Image}
                alt={ipo.Name}
                className="w-full h-32 object-contain p-2"
              />
            )}
            <CardContent className="space-y-1">
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-lg">{ipo.Name}</h2>
                <span className="text-sm px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">{ipo.Type}</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-300">{ipo.Status}</p>
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

