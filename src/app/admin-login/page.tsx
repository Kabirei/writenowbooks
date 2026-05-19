"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Page(){

const router=
useRouter();

const [password,setPassword]=
useState("");

const [message,setMessage]=
useState("");

const [loading,setLoading]=
useState(false);

const handleLogin=
async()=>{

setLoading(true);

setMessage("");

try{

const response=
await fetch(
"/api/admin/login",
{
method:"POST",
headers:{
"Content-Type":
"application/json"
},
body:JSON.stringify({
password
})
}
);

const data=
await response.json();

if(
!response.ok
||
!data.success
){

throw new Error(
data.message
);

}

router.push(
"/admin/esa"
);

}catch(error){

setMessage(
error instanceof Error
? error.message
: "Login failed."
);

}

setLoading(false);

};

return(

<main className="
min-h-screen
bg-black
text-white
flex
justify-center
items-center
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
text-center
mb-6
">

WriteNowBooks
Admin Login

</h1>

<input
type="password"
placeholder="Password"
value={password}
onChange={(e)=>
setPassword(
e.target.value
)}
className="
w-full
p-4
rounded-lg
bg-gray-900
border
border-gray-700
mb-5
"
/>

<button
onClick={
handleLogin
}
disabled={
loading
}
className="
w-full
bg-yellow-400
text-black
font-bold
p-4
rounded-lg
"
>

{
loading
?
"Logging in..."
:
"Login"
}

</button>

{message&&(

<p className="
mt-5
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