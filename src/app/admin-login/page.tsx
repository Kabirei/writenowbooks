"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Page() {

  const [password,setPassword] =
    useState("");

  const [message,setMessage] =
    useState("");

  const router =
    useRouter();

  const handleLogin = () => {

    if (
      password ===
      "WriteNowBooksAdmin2026"
    ) {

      document.cookie =
        "admin_access=granted; path=/";

      router.push(
        "/admin/esa"
      );

    } else {

      setMessage(
        "Incorrect password."
      );

    }

  };

  return (

<main className="
min-h-screen
bg-black
text-white
flex
items-center
justify-center
px-6
">

<div className="
w-full
max-w-md
bg-gray-950
border
border-gray-700
rounded-2xl
p-8
">

<h1 className="
text-3xl
font-bold
mb-6
text-center
">
Admin Login
</h1>

<p className="
text-gray-400
mb-6
text-center
">
Enter admin password
</p>

<input
type="password"
value={password}
onChange={(e)=>
setPassword(
e.target.value
)}
placeholder="Password"
className="
w-full
p-4
rounded-lg
bg-gray-900
border
border-gray-700
mb-6
"
/>

<button
onClick={handleLogin}
className="
w-full
bg-yellow-400
text-black
font-bold
p-4
rounded-lg
"
>
Login
</button>

{message && (

<p className="
mt-4
text-red-400
text-center
">
{message}
</p>

)}

</div>

</main>

  );
}