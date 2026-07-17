const slider = document.getElementById("1");
const hi = document.getElementById("hi");

function test() {
  hi.textContent = parseInt(slider.value) + 1 + "%";
}

slider.addEventListener("input", test);
test(); // set it once on load