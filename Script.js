function addToDisplay(value) {
  document.getElementById("display").value += value;
}

function clearDisplay() {
  document.getElementById("display").value = "";
}

function calculate() {
  const display = document.getElementById("display");

  try {
    display.value = Function("return " + display.value)();
  } catch {
    display.value = "Error";
  }
}

// Make functions available to the HTML buttons
window.addToDisplay = addToDisplay;
window.clearDisplay = clearDisplay;
window.calculate = calculate;
