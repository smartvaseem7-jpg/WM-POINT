document.addEventListener("DOMContentLoaded", () => {

console.log("WM POINT Loaded Successfully!");

const btn = document.querySelector(".btn");

if(btn){
btn.addEventListener("click", function(e){
e.preventDefault();
alert("Welcome to WM POINT 🏏");
});
}

});
