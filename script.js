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
