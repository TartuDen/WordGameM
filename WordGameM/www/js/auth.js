import { userDataList } from "./mockUser.js";
import { englishList } from "./words.js"; // Import word list for dynamic vocabulary checkboxes
import { displayUserInfo, showWord } from "./app.js"; // So we can call them after login

let userList = [];
let selectedUserId = null;
let selectedAvatar = "";

document.addEventListener("DOMContentLoaded", () => {
  populateVocabCheckboxes();
  loadUserProfilesFromStorage();
  populateExistingProfiles();

  document
    .getElementById("selectProfileBtn")
    .addEventListener("click", onSelectProfile);
  document
    .getElementById("deleteProfileBtn")
    .addEventListener("click", onDeleteProfile);
  document
    .getElementById("createOrUpdateProfileBtn")
    .addEventListener("click", onCreateOrUpdateProfile);

  const avatarOptions = document.querySelectorAll(".avatar-option");
  avatarOptions.forEach((img) => {
    img.addEventListener("click", () => {
      avatarOptions.forEach((img) => img.classList.remove("selected"));
      img.classList.add("selected");
      selectedAvatar = img.getAttribute("data-avatar");
    });
  });
});

function populateVocabCheckboxes() {
  const vocabContainer = document.getElementById("vocab-checkboxes");
  vocabContainer.innerHTML = "";

  const title = document.createElement("p");
  title.textContent = "Select vocabularies:";
  vocabContainer.appendChild(title);

  const uniqueVocabs = new Set();
  englishList.forEach(word => {
    if (word.vocabulary && Array.isArray(word.vocabulary)) {
      word.vocabulary.forEach(v => uniqueVocabs.add(v));
    }
  });

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

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

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

  document.getElementById("newUserName").value = user.user_name;

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
    const avatarOptions = document.querySelectorAll(".avatar-option");
    avatarOptions.forEach((img) => img.classList.remove("selected"));
    selectedAvatar = "";
  }

  const checkboxes = document.querySelectorAll('input[name="vocabType"]');
  checkboxes.forEach((box) => {
    box.checked = false;
  });

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

  const newUser = {
    user_id: Date.now(),
    user_name: newUserName,
    user_reg_data: new Date().toLocaleDateString(),
    vocabulary: selectedVocab,
    avatar: selectedAvatar
  };

  userList.push(newUser);
  saveUserProfilesToStorage();
  setCurrentUser(newUser);
}

function onDeleteProfile() {
  if (!selectedUserId) {
    alert("No profile is selected. Please select a profile to delete.");
    return;
  }

  if (!confirm("Are you sure you want to delete this profile? This cannot be undone.")) {
    return;
  }

  userList = userList.filter(
    (u) => String(u.user_id) !== String(selectedUserId)
  );
  saveUserProfilesToStorage();

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

  document.getElementById("newUserName").value = "";
  const checkboxes = document.querySelectorAll('input[name="vocabType"]');
  checkboxes.forEach((box) => (box.checked = false));

  const avatarOptions = document.querySelectorAll(".avatar-option");
  avatarOptions.forEach((img) => img.classList.remove("selected"));
  selectedAvatar = "";

  alert("Profile deleted successfully.");
}

function setCurrentUser(user) {
  localStorage.setItem("currentUser", JSON.stringify(user));
  document.getElementById("profilePage").classList.add("hidden");
  document.getElementById("gamePage").classList.remove("hidden");
  displayUserInfo();
  showWord();
  document.getElementById("newUserName").value = "";
  const checkboxes = document.querySelectorAll('input[name="vocabType"]');
  checkboxes.forEach((box) => (box.checked = false));
  const avatarOptions = document.querySelectorAll(".avatar-option");
  avatarOptions.forEach((img) => img.classList.remove("selected"));
  selectedAvatar = "";
  selectedUserId = null;
}

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

function loadUserProfilesFromStorage() {
  const data = localStorage.getItem("userList");
  if (data) {
    userList = JSON.parse(data);
  } else {
    userList = userDataList;
    saveUserProfilesToStorage();
  }
}

function saveUserProfilesToStorage() {
  localStorage.setItem("userList", JSON.stringify(userList));
}
