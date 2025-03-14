// WordGameM\www\js\auth.js
import { user_data } from "./mockUser.js";

let userList = [];
let selectedUserId = null; // Track which user is currently being updated (if any)

document.addEventListener("DOMContentLoaded", () => {
  // 1) Attempt to load profiles from localStorage
  loadUserProfilesFromStorage();

  // 2) Populate existing profiles <select> with userList
  populateExistingProfiles();

  // 3) Event listeners for selecting user, creating/updating user
  document
    .getElementById("selectProfileBtn")
    .addEventListener("click", onSelectProfile);

  document
    .getElementById("createOrUpdateProfileBtn")
    .addEventListener("click", onCreateOrUpdateProfile);
});

/**
 * 1) If user selects an existing profile from the dropdown,
 *    store that user as "currentUser", show the game page.
 */
function onSelectProfile() {
  const selectEl = document.getElementById("existingProfilesSelect");
  selectedUserId = selectEl.value; // e.g. "1" or some timestamp

  if (!selectedUserId) {
    alert("Please select an existing profile or create a new one.");
    return;
  }

  // Find the user
  const user = userList.find((u) => String(u.user_id) === String(selectedUserId));
  if (!user) {
    alert("User not found. Please create a new profile.");
    return;
  }

  // Set current user in localStorage
  setCurrentUser(user);
}

/**
 * 2) Create a new user OR update an existing one, depending on whether
 *    'selectedUserId' is set from the dropdown selection.
 */
function onCreateOrUpdateProfile() {
  const newUserName = document.getElementById("newUserName").value.trim();

  // Gather the selected vocab checkboxes
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

  // If we have a 'selectedUserId' from the dropdown, we might update that user
  if (selectedUserId) {
    const existingUser = userList.find((u) => String(u.user_id) === String(selectedUserId));
    if (existingUser) {
      // Update the user object
      existingUser.user_name = newUserName;
      existingUser.vocabulary = selectedVocab;
      // Save to storage
      saveUserProfilesToStorage();
      // Also set this user as current
      setCurrentUser(existingUser);
      return;
    }
  }

  // Otherwise, create a brand new user
  const newUser = {
    user_id: Date.now(), // unique mock ID
    user_name: newUserName,
    user_reg_data: new Date().toLocaleDateString(),
    vocabulary: selectedVocab,
  };

  userList.push(newUser);
  saveUserProfilesToStorage();
  setCurrentUser(newUser);
}

/**
 * 3) Once we know the current user, we store in localStorage,
 *    hide the profile page and show the game page.
 */
function setCurrentUser(user) {
  localStorage.setItem("currentUser", JSON.stringify(user));

  document.getElementById("profilePage").classList.add("hidden");
  document.getElementById("gamePage").classList.remove("hidden");

  // Clear out the create profile form
  document.getElementById("newUserName").value = "";
  const checkboxes = document.querySelectorAll('input[name="vocabType"]');
  checkboxes.forEach((box) => (box.checked = false));

  // Reset selectedUserId
  selectedUserId = null;

  // (Optionally) call a function in app.js to refresh logic if needed
}

/**
 * Displays all known users in the <select> dropdown.
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
 * Load user profiles from localStorage or fall back to the mock user.
 */
function loadUserProfilesFromStorage() {
  const data = localStorage.getItem("userList");
  if (data) {
    userList = JSON.parse(data);
  } else {
    // If no user list in localStorage, start with our mock user "Den"
    userList = [user_data];
    saveUserProfilesToStorage();
  }
}

/**
 * Save user profiles to localStorage.
 */
function saveUserProfilesToStorage() {
  localStorage.setItem("userList", JSON.stringify(userList));
}
