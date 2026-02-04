// WordGameM\www\js\index.js

document.addEventListener("DOMContentLoaded", onDomLoaded);
document.addEventListener("deviceready", onDeviceReady, false);

function onDomLoaded() {
  const storedTheme = localStorage.getItem("selectedTheme") || "light";
  const lightBtn = document.getElementById("themeLightBtn");
  const darkBtn = document.getElementById("themeDarkBtn");

  if (lightBtn && darkBtn) {
    if (storedTheme === "dark") {
      darkBtn.classList.add("active");
    } else {
      lightBtn.classList.add("active");
    }

    [lightBtn, darkBtn].forEach((btn) => {
      btn.addEventListener("click", () => {
        const newTheme = btn.getAttribute("data-theme") || "light";
        localStorage.setItem("selectedTheme", newTheme);
        location.reload();
      });
    });
  }

  // ... any other DOMContentLoaded logic you need ...
}

function onDeviceReady() {
  console.log("Running cordova-" + cordova.platformId + "@" + cordova.version);
  // Additional deviceready logic can go here if needed
}
