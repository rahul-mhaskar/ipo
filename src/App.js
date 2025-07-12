import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';

function App() {
  const [data, setData] = useState([]);

  useEffect(() => {
    Papa.parse(
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vRlsMurbsXT2UBQ2ADbyoiQtLUTznQU4vNzw3nS02_StSrFV9pkrnXOrNAjV_Yj-Byc_zw72z_rM0tQ/pub?output=csv',
      {
        download: true,
        header: true,
        complete: (results) => {
          setData(results.data);
        },
      }
    );
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4">
      {/* Header */}
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-1">IPO Track</h1>
        <p className="text-sm text-gray-500">Live IPO Details, GMP, Allotments, and More</p>
      </header>

      {/* IPO Table Section */}
      <div className="max-w-[calc(100%-80px)] mr-auto overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
          <thead className="bg-gray-100 text-sm">
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">Type</th>
              <th className="p-2">GMP</th>
              <th className="p-2">Subscription</th>
              <th className="p-2">Price</th>
              <th className="p-2">Est. Listing</th>
              <th className="p-2">IPO Size</th>
              <th className="p-2">Lot</th>
              <th className="p-2">Open Date</th>
              <th className="p-2">Close Date</th>
              <th className="p-2">BoA Date</th>
              <th className="p-2">Listing Date</th>
              <th className="p-2">Allotment Link</th>
            </tr>
          </thead>
          <tbody>
            {data.map((ipo, i) => (
              <tr key={i} className="border-t">
                <td className="p-2 font-semibold">{ipo.Name}</td>
                <td className="p-2">{ipo.Type}</td>
                <td className="p-2">{ipo.GMP}</td>
                <td className="p-2">{ipo.Subscription}</td>
                <td className="p-2">{ipo.Price}</td>
                <td className="p-2">{ipo['Est Listing']}</td>
                <td className="p-2">{ipo['IPO Size']}</td>
                <td className="p-2">{ipo.Lot}</td>
                <td className="p-2">{ipo['Open dt']}</td>
                <td className="p-2">{ipo['Close dt']}</td>
                <td className="p-2">{ipo['BoA Dt']}</td>
                <td className="p-2">{ipo['Listing dt']}</td>
                <td className="p-2">
                  <a
                    href={ipo['Allotment Link']}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Check
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Broker Referral Sidebar - Fixed Right */}
      <div className="fixed right-0 top-1/3 z-50 flex flex-col items-center gap-4 p-2 w-[64px] bg-white shadow-lg rounded-l-xl border border-gray-200">
        <a
          href="https://zerodha.com/open-account?c=VCB643"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="https://zerodha.com/static/images/logo.svg"
            alt="Zerodha"
            className="h-8 w-auto"
          />
        </a>
        <a
          href="https://upstox.onelink.me/0H1s/4LAYGW"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="https://assets-netstorage.groww.in/brokers/logos/UPSTOX.png"
            alt="Upstox"
            className="h-8 w-auto"
          />
        </a>
        <a
          href="https://paytmmoney.page.link/DSwSvdhoasovQYLz9"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="https://static.paytmmoney.com/android-chrome-192x192.png"
            alt="Paytm Money"
            className="h-8 w-auto"
          />
        </a>
        
      </div>
    </div>
  );
}

export default App;
