// WordGameM\www\js\auth.js
import { user_data } from "./mockUser.js";

let userList = [];
let selectedUserId = null; // track which user we are updating (if any)

document.addEventListener("DOMContentLoaded", () => {
  // 1) Load profiles from localStorage
  loadUserProfilesFromStorage();

  // 2) Populate the dropdown
  populateExistingProfiles();

  // 3) Set up event listeners
  document
    .getElementById("selectProfileBtn")
    .addEventListener("click", onSelectProfile);

  document
    .getElementById("createOrUpdateProfileBtn")
    .addEventListener("click", onCreateOrUpdateProfile);
});

/**
 * SELECT an existing profile from the dropdown
 */
function onSelectProfile() {
  const selectEl = document.getElementById("existingProfilesSelect");
  selectedUserId = selectEl.value;

  if (!selectedUserId) {
    alert("Please select an existing profile or create a new one.");
    return;
  }

  const user = userList.find((u) => String(u.user_id) === String(selectedUserId));
  if (!user) {
    alert("User not found. Please create a new profile.");
    return;
  }

  setCurrentUser(user);
}

/**
 * CREATE or UPDATE a profile (depending on whether selectedUserId is set)
 */
function onCreateOrUpdateProfile() {
  const newUserName = document.getElementById("newUserName").value.trim();

  // gather selected vocab checkboxes
  const checkboxes = document.querySelectorAll('input[name="vocabType"]');
  const selectedVocab = [];
  checkboxes.forEach((box) => {
    if (box.checked) {
      selectedVocab.push(box.value);
    }
  });

  if (!newUserName) {
    alert("Please enter a name for the profile.");
    return;
  }

  // If we have selectedUserId, see if we're updating an existing user
  if (selectedUserId) {
    const existingUser = userList.find((u) => String(u.user_id) === String(selectedUserId));
    if (existingUser) {
      existingUser.user_name = newUserName;
      existingUser.vocabulary = selectedVocab;
      saveUserProfilesToStorage();
      setCurrentUser(existingUser);
      return;
    }
  }

  // Otherwise, create a brand new user
  const newUser = {
    user_id: Date.now(),
    user_name: newUserName,
    user_reg_data: new Date().toLocaleDateString(),
    vocabulary: selectedVocab,
  };

  userList.push(newUser);
  saveUserProfilesToStorage();
  setCurrentUser(newUser);
}

/**
 * Sets the currentUser in localStorage, then switches to the game page
 */
function setCurrentUser(user) {
  localStorage.setItem("currentUser", JSON.stringify(user));

  // Hide profile page, show game page
  document.getElementById("profilePage").classList.add("hidden");
  document.getElementById("gamePage").classList.remove("hidden");

  // Clear the form
  document.getElementById("newUserName").value = "";
  const checkboxes = document.querySelectorAll('input[name="vocabType"]');
  checkboxes.forEach((box) => (box.checked = false));

  // Reset selectedUserId
  selectedUserId = null;
}

/**
 * Populate the <select> with all known users
 */
function populateExistingProfiles() {
  const selectEl = document.getElementById("existingProfilesSelect");
  selectEl.innerHTML = '<option value="">--No profiles--</option>';

  userList.forEach((usr) => {
    const option = document.createElement("option");
    option.value = usr.user_id;
    option.textContent = `${usr.user_name} (vocab: ${usr.vocabulary.join(",")})`;
    selectEl.appendChild(option);
  });
}

/**
 * Load existing user profiles from localStorage, or seed with mock user if none
 */
function loadUserProfilesFromStorage() {
  const data = localStorage.getItem("userList");
  if (data) {
    userList = JSON.parse(data);
  } else {
    // If none found, start with our mock user "Den"
    userList = [user_data];
    saveUserProfilesToStorage();
  }
}

/**
 * Save user profiles to localStorage
 */
function saveUserProfilesToStorage() {
  localStorage.setItem("userList", JSON.stringify(userList));
}
