// WordGameM\www\js\auth.js

import { userDataList } from "./mockUser.js";
import { englishList } from "./words.js";
import { displayUserInfo, showWord } from "./app.js";

let userList = [];
let selectedUserId = null;
let selectedAvatar = "";

/** DOM Ready **/
document.addEventListener("DOMContentLoaded", () => {
  populateVocabCheckboxes(); // For new-user creation
  loadUserProfilesFromStorage();
  populateExistingProfiles();

  // Selecting an existing profile automatically logs you in.
  document
    .getElementById("existingProfilesSelect")
    .addEventListener("change", onSelectProfile);

  document
    .getElementById("deleteProfileBtn")
    .addEventListener("click", onDeleteProfile);

  document
    .getElementById("createOrUpdateProfileBtn")
    .addEventListener("click", onCreateOrUpdateProfile);

  // Avatar selection
  const avatarOptions = document.querySelectorAll(".avatar-option");
  avatarOptions.forEach((img) => {
    img.addEventListener("click", () => {
      avatarOptions.forEach((img2) => img2.classList.remove("selected"));
      img.classList.add("selected");
      selectedAvatar = img.getAttribute("data-avatar");
    });
  });
});

/** Populate checkboxes for new user creation. */
function populateVocabCheckboxes() {
  const vocabContainer = document.getElementById("vocab-checkboxes");
  if (!vocabContainer) return;

  vocabContainer.innerHTML = "";

  const title = document.createElement("p");
  title.textContent = "Pick categories:";
  vocabContainer.appendChild(title);

  const uniqueVocabs = new Set();
  englishList.forEach((word) => {
    if (Array.isArray(word.vocabulary)) {
      word.vocabulary.forEach((v) => uniqueVocabs.add(v));
    }
  });

  uniqueVocabs.forEach((vocab) => {
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

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** When an existing user is selected, immediately go to game page. */
function onSelectProfile() {
  selectedUserId = this.value;
  if (!selectedUserId) return; // no selection

  const user = userList.find((u) => String(u.user_id) === String(selectedUserId));
  if (!user) {
    alert("User not found. Please create a new profile.");
    return;
  }

  setCurrentUser(user);
}

/** Creates or updates a user profile, then logs in. */
function onCreateOrUpdateProfile() {
  const newUserName = document.getElementById("newUserName").value.trim();

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

  if (selectedUserId) {
    // Possibly updating an existing user
    const existingUser = userList.find(
      (u) => String(u.user_id) === String(selectedUserId)
    );
    if (existingUser) {
      existingUser.user_name = newUserName;
      existingUser.vocabulary = selectedVocab;
      existingUser.avatar = selectedAvatar;
      existingUser.user_reg_data =
        existingUser.user_reg_data || new Date().toLocaleDateString();

      saveUserProfilesToStorage();
      setCurrentUser(existingUser);
      return;
    }
  }

  // Otherwise, create brand new user
  const newUser = {
    user_id: Date.now(),
    user_name: newUserName,
    user_reg_data: new Date().toLocaleDateString(),
    vocabulary: selectedVocab,
    avatar: selectedAvatar,
  };

  userList.push(newUser);
  saveUserProfilesToStorage();
  setCurrentUser(newUser);
}

/** Delete the currently selected user profile. */
function onDeleteProfile() {
  if (!selectedUserId) {
    alert("No profile selected. Please pick a profile to delete.");
    return;
  }
  if (!confirm("Are you sure you want to delete this profile?")) {
    return;
  }

  userList = userList.filter((u) => String(u.user_id) !== String(selectedUserId));
  saveUserProfilesToStorage();

  // Remove user progress for that user
  let storedProgress = localStorage.getItem("userProgressList");
  if (storedProgress) {
    let progressList = JSON.parse(storedProgress);
    progressList = progressList.filter(
      (up) => String(up.user_id) !== String(selectedUserId)
    );
    localStorage.setItem("userProgressList", JSON.stringify(progressList));
  }

  selectedUserId = null;
  document.getElementById("gamePage").classList.add("hidden");
  document.getElementById("profilePage").classList.remove("hidden");
  populateExistingProfiles();

  // Clear form
  document.getElementById("newUserName").value = "";
  const checkboxes = document.querySelectorAll('input[name="vocabType"]');
  checkboxes.forEach((box) => (box.checked = false));
  const avatarOptions = document.querySelectorAll(".avatar-option");
  avatarOptions.forEach((img) => img.classList.remove("selected"));
  selectedAvatar = "";

  alert("Profile deleted successfully.");
}

/** Logs in with the given user object. */
function setCurrentUser(user) {
  localStorage.setItem("currentUser", JSON.stringify(user));
  document.getElementById("profilePage").classList.add("hidden");
  document.getElementById("gamePage").classList.remove("hidden");

  // Clear creation form
  document.getElementById("newUserName").value = "";
  const checkboxes = document.querySelectorAll('input[name="vocabType"]');
  checkboxes.forEach((box) => (box.checked = false));
  const avatarOptions = document.querySelectorAll(".avatar-option");
  avatarOptions.forEach((img) => img.classList.remove("selected"));

  selectedAvatar = "";
  selectedUserId = null;

  // Now show user info & start
  displayUserInfo();
  showWord();
}

/** Refresh the dropdown list of existing users. */
function populateExistingProfiles() {
  const selectEl = document.getElementById("existingProfilesSelect");
  selectEl.innerHTML = '<option value="">--No profiles--</option>';

  userList.forEach((usr) => {
    const option = document.createElement("option");
    option.value = usr.user_id;
    const vocabLabel =
      usr.vocabulary && usr.vocabulary.length
        ? ` (Vocab: ${usr.vocabulary.join(", ")})`
        : "";
    option.textContent = `${usr.user_name}${vocabLabel}`;
    selectEl.appendChild(option);
  });
}

/** Load user profiles from localStorage or fallback to mock data. */
function loadUserProfilesFromStorage() {
  const data = localStorage.getItem("userList");
  if (data) {
    userList = JSON.parse(data);
  } else {
    userList = userDataList;
    saveUserProfilesToStorage();
  }
}

/** Save user profiles to localStorage. */
function saveUserProfilesToStorage() {
  localStorage.setItem("userList", JSON.stringify(userList));
}
