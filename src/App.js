// ✅ Optimized, Enhanced Version (Full Sorting Support + Card/Table Toggle)

// [Previous content unchanged until table <thead> update]

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

// [Rest of the code stays the same — just ensures all headers have clickable sorting]

// 🔁 Also: Ensure Apply Now only shows if Status is "Open - Apply Now"
// and AllotmentLink only appears if Status includes "Allotment Out"

<a
  href={ipo.ApplyURL || "#"}
  target="_blank"
  rel="noreferrer"
  className={`px-2 py-1 bg-green-500 text-white rounded ${ipo.Status !== "Open - Apply Now" ? "hidden" : ""}`}
>
  Apply Now
</a>
<a
  href={ipo.AllotmentLink1 || "#"}
  target="_blank"
  rel="noreferrer"
  className={`px-2 py-1 bg-blue-500 text-white rounded ${!ipo.Status?.includes("Allotment Out") ? "hidden" : ""}`}
>
  Check Allotment
</a>
