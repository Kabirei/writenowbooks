"use client";

import { useEffect, useState } from "react";

export default function Page() {

const [studentAccess,setStudentAccess] =
useState<boolean | null>(null);

const [loading,setLoading] =
useState(true);

useEffect(()=>{

const request =
localStorage.getItem(
"esaRequest"
);

if(!request){

setStudentAccess(
false
);

setLoading(
false
);

return;

}

const parsed =
JSON.parse(
request
);

fetch(
"/api/student/access",
{
method:"POST",
headers:{
"Content-Type":
"application/json"
},
body:JSON.stringify({

parentEmail:
parsed.parentEmail

})
}
)

.then(
response=>
response.json()
)

.then(data=>{

if(
data.success
){

setStudentAccess(
data.studentAccess
);

}

})

.catch(error=>{

console.error(
error
);

setStudentAccess(
false
);

})

.finally(()=>{

setLoading(
false
);

});

},[]);

if(
loading
){

return(

<main className="
min-h-screen
bg-black
text-white
flex
justify-center
items-center
">

Loading dashboard...

</main>

);

}

if(
!studentAccess
){

return(

<main className="
min-h-screen
bg-black
text-white
px-6
py-16
">

<div className="
max-w-3xl
mx-auto
bg-gray-950
border
border-gray-700
rounded-2xl
p-10
text-center
">

<h1 className="
text-4xl
font-bold
mb-6
">

Funding Pending

</h1>

<p className="
text-gray-300
text-lg
">

Your ESA request
has not yet been
funded.

Once funding
is confirmed,
your student
workspace will
unlock automatically.

</p>

</div>

</main>

);

}

return(

<main className="
min-h-screen
bg-black
text-white
px-6
py-16
">

<div className="
max-w-6xl
mx-auto
">

<h1 className="
text-4xl
font-bold
mb-6
">

Student Dashboard

</h1>

<p className="
text-gray-400
mb-10
">

Welcome to
WriteNowBooks
Student Author Program

</p>

<div className="
grid
md:grid-cols-2
gap-6
">

<div className="
bg-gray-950
border
border-gray-700
rounded-2xl
p-8
">

<h2 className="
text-2xl
font-bold
mb-3
">

My Book Project

</h2>

<p className="
text-gray-400
">

Your student
project is active.

</p>

</div>

<div className="
bg-gray-950
border
border-gray-700
rounded-2xl
p-8
">

<h2 className="
text-2xl
font-bold
mb-3
">

Book Builder

</h2>

<p className="
text-gray-400
">

Begin building
your book.

</p>

</div>

<div className="
bg-gray-950
border
border-gray-700
rounded-2xl
p-8
">

<h2 className="
text-2xl
font-bold
mb-3
">

Progress

</h2>

<p className="
text-gray-400
">

Track progress
and milestones.

</p>

</div>

<div className="
bg-gray-950
border
border-gray-700
rounded-2xl
p-8
">

<h2 className="
text-2xl
font-bold
mb-3
">

Messages

</h2>

<p className="
text-gray-400
">

Communication
and updates.

</p>

</div>

</div>

</div>

</main>

);

}