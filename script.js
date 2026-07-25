// ==============================
// WM POINT - SUPER FRIENDS
// script.js
// ==============================

// Page Load
window.addEventListener("load", () => {
    console.log("WM POINT Loaded Successfully");
});

// Live Score Demo
let score = 124;
let wickets = 3;
let overs = 15.2;

const scoreElement = document.querySelector(".score h1");
const overElement = document.querySelector(".score p");

setInterval(() => {

    if (Math.random() > 0.70) {

        score++;

        if (Math.random() > 0.85 && wickets < 10) {
            wickets++;
        }

        overs += 0.1;

        scoreElement.innerHTML = score + " / " + wickets;
        overElement.innerHTML = overs.toFixed(1) + " Overs";

    }

}, 5000);


// Live Dot Animation

const liveDot = document.querySelector(".live-dot");

setInterval(() => {

    liveDot.classList.toggle("active");

},700);


// Smooth Scroll

document.querySelectorAll('a[href^="#"]').forEach(link=>{

link.addEventListener("click",function(e){

e.preventDefault();

document.querySelector(this.getAttribute("href"))
.scrollIntoView({

behavior:"smooth"

});

});

});


// Button Animation

const buttons=document.querySelectorAll(".btn");

buttons.forEach(btn=>{

btn.addEventListener("mouseenter",()=>{

btn.style.transform="scale(1.08)";

});

btn.addEventListener("mouseleave",()=>{

btn.style.transform="scale(1)";

});

});


// Welcome Message

setTimeout(()=>{

console.log("Welcome to WM POINT - SUPER FRIENDS");

},1500);
// ============================
// WM POINT PART 4 FEATURES
// ============================


// Mobile Menu

const menuBtn = document.createElement("div");

menuBtn.innerHTML = "☰";
menuBtn.className = "menu-btn";

document.querySelector("header").appendChild(menuBtn);


menuBtn.onclick = () => {

document.querySelector("nav ul")
.classList.toggle("show");

};


// Match Countdown

let matchDate = new Date("August 10, 2026 16:00:00").getTime();


setInterval(()=>{

let now = new Date().getTime();

let distance = matchDate - now;


let days = Math.floor(distance/(1000*60*60*24));

let hours = Math.floor((distance%(1000*60*60*24))/(1000*60*60));

let minutes = Math.floor((distance%(1000*60*60))/(1000*60));


let timer = document.querySelector(".countdown");


if(timer){

timer.innerHTML =
days+" Days "+
hours+" Hours "+
minutes+" Minutes";

}


},1000);



// Scroll Top Button

const topBtn=document.createElement("button");

topBtn.innerHTML="↑";

topBtn.className="top-btn";

document.body.appendChild(topBtn);


window.onscroll=()=>{

if(window.scrollY>400){

topBtn.style.display="block";

}else{

topBtn.style.display="none";

}

};


topBtn.onclick=()=>{

window.scrollTo({

top:0,

behavior:"smooth"

});

};



// Player Counter Animation

let counters=document.querySelectorAll(".counter");


counters.forEach(counter=>{

let value=0;

let target=counter.dataset.number;


let timer=setInterval(()=>{

value++;

counter.innerHTML=value;


if(value>=target){

clearInterval(timer);

}

},20);


});
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC3qHN28dqPBFnNQ2jLSmYuejPPrd0T2mQ",
  authDomain: "wm-point.firebaseapp.com",
  projectId: "wm-point",
  storageBucket: "wm-point.firebasestorage.app",
  messagingSenderId: "114760357274",
  appId: "1:114760357274:web:0a4bf908703cf352d51623",
  measurementId: "G-EW8PXFGCCH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
