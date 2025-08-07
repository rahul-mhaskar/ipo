import React, { useState } from "react";

export default function ContactUs({ user }) {
const [message, setMessage] = useState("");

const handleSubmit = (e) => {
e.preventDefault();
if (!user) return;
alert(Message sent from ${user.email}: ${message});
setMessage("");
};

if (!user) {
return (

Please sign in with Google to contact us.

);
}

return (

Contact Us


Name
<input
type="text"
value={user.displayName || ""}
readOnly
className="w-full border px-3 py-2 rounded bg-gray-100"
/>


Email
<input
type="email"
value={user.email || ""}
readOnly
className="w-full border px-3 py-2 rounded bg-gray-100"
/>


Message
<textarea
value={message}
onChange={(e) => setMessage(e.target.value)}
required
className="w-full border px-3 py-2 rounded"
/>


Send



);
}

