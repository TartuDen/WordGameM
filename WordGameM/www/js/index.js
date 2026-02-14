// WordGameM\www\js\index.js

document.addEventListener("DOMContentLoaded", onDomLoaded);
document.addEventListener("deviceready", onDeviceReady, false);

function onDomLoaded() {
  const storedPalette = localStorage.getItem("selectedPalette") || "teal";
  const paletteButtons = Array.from(document.querySelectorAll(".palette-btn"));

  applyStyle("clean");
  applyPalette(storedPalette, paletteButtons);

  paletteButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const newPalette = btn.getAttribute("data-palette") || "teal";
      localStorage.setItem("selectedPalette", newPalette);
      applyPalette(newPalette, paletteButtons);
    });
  });

  // ... any other DOMContentLoaded logic you need ...
}

function applyStyle(styleName) {
  document.body.classList.remove("style-playful", "style-clean", "style-bold");
  document.body.classList.add(`style-${styleName}`);
}

function applyPalette(paletteName, buttons) {
  const allowedPalettes = ["teal", "sunset", "aurora", "lime"];
  const resolvedPalette = allowedPalettes.includes(paletteName)
    ? paletteName
    : "teal";
  document.body.classList.remove(
    "palette-teal",
    "palette-sunset",
    "palette-aurora",
    "palette-lime"
  );
  document.body.classList.add(`palette-${resolvedPalette}`);

  buttons.forEach((btn) => {
    const buttonPalette = btn.getAttribute("data-palette");
    btn.classList.toggle("active", buttonPalette === resolvedPalette);
  });
}

function onDeviceReady() {
  console.log("Running cordova-" + cordova.platformId + "@" + cordova.version);
  // Additional deviceready logic can go here if needed
}
