// WordGameM/www/js/auth.js

import { userDataList } from "./mockUser.js";
import { englishList } from "./words.js"; // Import word list for dynamic vocabulary checkboxes
import { displayUserInfo, showWord } from "./app.js"; // So we can call them after login

let userList = [];
let selectedUserId = null; // which user we are editing (if any)
let selectedAvatar = "";  // holds the chosen avatar filename

document.addEventListener("DOMContentLoaded", () => {
  // Generate vocabulary checkboxes dynamically based on words.js
  populateVocabCheckboxes();

  // 1) Load profiles from localStorage
  loadUserProfilesFromStorage();

  // 2) Populate the dropdown
  populateExistingProfiles();

  // 3) Set up event listeners
  document
    .getElementById("selectProfileBtn")
    .addEventListener("click", onSelectProfile);

  document
    .getElementById("deleteProfileBtn")
    .addEventListener("click", onDeleteProfile);

  document
    .getElementById("createOrUpdateProfileBtn")
    .addEventListener("click", onCreateOrUpdateProfile);

  // Set up avatar selection event listeners
  const avatarOptions = document.querySelectorAll(".avatar-option");
  avatarOptions.forEach((img) => {
    img.addEventListener("click", () => {
      // Remove selected class from all avatars
      avatarOptions.forEach((img) => img.classList.remove("selected"));
      // Add selected class to clicked avatar
      img.classList.add("selected");
      // Set the selectedAvatar variable
      selectedAvatar = img.getAttribute("data-avatar");
    });
  });
});

/**
 * Populates the vocabulary checkboxes dynamically.
 * It collects all unique vocabulary types from englishList.
 */
function populateVocabCheckboxes() {
  const vocabContainer = document.getElementById("vocab-checkboxes");
  vocabContainer.innerHTML = ""; // Clear existing content

  const title = document.createElement("p");
  title.textContent = "Select vocabularies:";
  vocabContainer.appendChild(title);

  // Collect unique vocabulary types from englishList
  const uniqueVocabs = new Set();
  englishList.forEach(word => {
    if (word.vocabulary && Array.isArray(word.vocabulary)) {
      word.vocabulary.forEach(v => uniqueVocabs.add(v));
    }
  });

  // For each unique vocabulary, create a checkbox with a label.
  uniqueVocabs.forEach(vocab => {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = "vocabType";
    checkbox.value = vocab;
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(" " + capitalize(vocab)));
    vocabContainer.appendChild(label);
  });
}

/**
 * Capitalizes the first letter of a string.
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * SELECT an existing profile from the dropdown,
 * then fill the form with its data (so you can edit).
 */
function onSelectProfile() {
  const selectEl = document.getElementById("existingProfilesSelect");
  selectedUserId = selectEl.value;

  if (!selectedUserId) {
    alert("Please select an existing profile to edit.");
    return;
  }

  const user = userList.find(
    (u) => String(u.user_id) === String(selectedUserId)
  );
  if (!user) {
    alert("User not found. Please create a new profile instead.");
    return;
  }

  // Fill the form fields
  document.getElementById("newUserName").value = user.user_name;

  // Set avatar selection if available
  if (user.avatar) {
    const avatarOptions = document.querySelectorAll(".avatar-option");
    avatarOptions.forEach((img) => {
      if (img.getAttribute("data-avatar") === user.avatar) {
        img.classList.add("selected");
        selectedAvatar = user.avatar;
      } else {
        img.classList.remove("selected");
      }
    });
  } else {
    // Clear selection if no avatar in user profile
    const avatarOptions = document.querySelectorAll(".avatar-option");
    avatarOptions.forEach((img) => img.classList.remove("selected"));
    selectedAvatar = "";
  }

  // Clear all checkboxes first
  const checkboxes = document.querySelectorAll('input[name="vocabType"]');
  checkboxes.forEach((box) => {
    box.checked = false;
  });

  // Check the user's existing vocab
  if (user.vocabulary && user.vocabulary.length > 0) {
    user.vocabulary.forEach((v) => {
      const box = document.querySelector(`input[name="vocabType"][value="${v}"]`);
      if (box) {
        box.checked = true;
      }
    });
  }

  alert(`Editing profile for "${user.user_name}".\nUpdate fields and click "Create/Update".`);
}

/**
 * CREATE or UPDATE a profile (depending on whether selectedUserId is set).
 * Then logs in the user.
 */
function onCreateOrUpdateProfile() {
  const newUserName = document.getElementById("newUserName").value.trim();

  // Gather selected vocab checkboxes
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

  // Create user object with avatar property
  if (selectedUserId) {
    // Update existing user
    const existingUser = userList.find(
      (u) => String(u.user_id) === String(selectedUserId)
    );
    if (existingUser) {
      existingUser.user_name = newUserName;
      existingUser.vocabulary = selectedVocab;
      existingUser.avatar = selectedAvatar;
      // Keep existing registration date or set one if missing
      existingUser.user_reg_data =
        existingUser.user_reg_data || new Date().toLocaleDateString();

      saveUserProfilesToStorage();
      // Now log in with this user
      setCurrentUser(existingUser);
      return;
    }
  }

  // Otherwise, create a brand new user
  const newUser = {
    user_id: Date.now(), // or use some other unique ID
    user_name: newUserName,
    user_reg_data: new Date().toLocaleDateString(),
    vocabulary: selectedVocab,
    avatar: selectedAvatar
  };

  userList.push(newUser);
  saveUserProfilesToStorage();
  setCurrentUser(newUser);
}

/**
 * DELETE the selected profile
 */
function onDeleteProfile() {
  if (!selectedUserId) {
    alert("No profile is selected. Please select a profile to delete.");
    return;
  }

  // Confirm with the user
  if (!confirm("Are you sure you want to delete this profile? This cannot be undone.")) {
    return;
  }

  // Remove from userList
  userList = userList.filter(
    (u) => String(u.user_id) !== String(selectedUserId)
  );
  saveUserProfilesToStorage();

  // Also remove progress from localStorage
  let storedProgress = localStorage.getItem("userProgressList");
  if (storedProgress) {
    let progressList = JSON.parse(storedProgress);
    progressList = progressList.filter(
      (up) => String(up.user_id) !== String(selectedUserId)
    );
    localStorage.setItem("userProgressList", JSON.stringify(progressList));
  }

  // Clear selection
  selectedUserId = null;

  // Hide game page if it was open, show profile page
  document.getElementById("gamePage").classList.add("hidden");
  document.getElementById("profilePage").classList.remove("hidden");

  // Re-populate the dropdown
  populateExistingProfiles();

  // Also clear the form fields
  document.getElementById("newUserName").value = "";
  const checkboxes = document.querySelectorAll('input[name="vocabType"]');
  checkboxes.forEach((box) => (box.checked = false));

  // Clear avatar selection
  const avatarOptions = document.querySelectorAll(".avatar-option");
  avatarOptions.forEach((img) => img.classList.remove("selected"));
  selectedAvatar = "";

  alert("Profile deleted successfully.");
}

/**
 * Sets the currentUser in localStorage, then switches to the game page,
 * and calls displayUserInfo() and showWord() so there's no blank page.
 */
function setCurrentUser(user) {
  localStorage.setItem("currentUser", JSON.stringify(user));

  // Hide profile page, show game page
  document.getElementById("profilePage").classList.add("hidden");
  document.getElementById("gamePage").classList.remove("hidden");

  // Show user data and a random word
  displayUserInfo();
  showWord();

  // Clear the form
  document.getElementById("newUserName").value = "";
  const checkboxes = document.querySelectorAll('input[name="vocabType"]');
  checkboxes.forEach((box) => (box.checked = false));

  // Clear avatar selection
  const avatarOptions = document.querySelectorAll(".avatar-option");
  avatarOptions.forEach((img) => img.classList.remove("selected"));
  selectedAvatar = "";

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
    option.textContent = `${usr.user_name} (vocab: ${usr.vocabulary.join(", ")})`;
    selectEl.appendChild(option);
  });
}

/**
 * Load existing user profiles from localStorage, or seed with mock user array if none
 */
function loadUserProfilesFromStorage() {
  const data = localStorage.getItem("userList");
  if (data) {
    userList = JSON.parse(data);
  } else {
    // If none found, start with our mock array
    userList = userDataList;
    saveUserProfilesToStorage();
  }
}

/**
 * Save user profiles to localStorage
 */
function saveUserProfilesToStorage() {
  localStorage.setItem("userList", JSON.stringify(userList));
}
