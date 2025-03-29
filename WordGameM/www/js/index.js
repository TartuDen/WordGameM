// WordGameM\www\js\index.js

document.addEventListener("DOMContentLoaded", onDomLoaded);
document.addEventListener("deviceready", onDeviceReady, false);

function onDomLoaded() {
  // 1) We dynamically load lightTheme.css or darkTheme.css in index.html
  //    using an inline script that checks localStorage at page start.
  
  // 2) Find the theme range slider
  const themeRange = document.getElementById("themeRange");
  if (themeRange) {
    // Check the stored theme or default to "light"
    const storedTheme = localStorage.getItem("selectedTheme") || "light";
    
    // If we had "dark" last time, slider goes to value=1
    // If "light", slider goes to 0
    themeRange.value = (storedTheme === "dark") ? "1" : "0";

    // On user changing the slider, store the new theme and reload
    themeRange.addEventListener("change", () => {
      const sliderValue = themeRange.value;
      const newTheme = (sliderValue === "1") ? "dark" : "light";

      // Save to localStorage so the inline script picks the right stylesheet
      localStorage.setItem("selectedTheme", newTheme);

      // Reload the page to apply the new theme
      location.reload();
    });
  }

  // ... any other DOMContentLoaded logic you need ...
}

function onDeviceReady() {
  console.log("Running cordova-" + cordova.platformId + "@" + cordova.version);
  // Additional deviceready logic can go here if needed
}
