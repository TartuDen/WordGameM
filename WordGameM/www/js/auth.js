// WordGameM\www\js\auth.js

import {
  displayUserInfo,
  ensureWordsLoaded,
  showWord,
} from "./app.js";
import {
  fetchCloudProgress,
  fetchUserProfile,
  saveUserProfile,
} from "./cloudRepository.js";
import { initAuth, signInWithGoogle, signOutUser } from "./firebaseAuth.js";
import { setSyncStatus } from "./syncStatus.js";

/** DOM Ready **/
document.addEventListener("DOMContentLoaded", async () => {
  await ensureWordsLoaded();
  await initAuth(handleAuthState);

  const googleSignInBtn = document.getElementById("googleSignInBtn");
  if (googleSignInBtn) {
    googleSignInBtn.addEventListener("click", () => {
      signInWithGoogle().catch((err) => {
        alert("Google sign-in failed. Check console for details.");
        console.warn("Google sign-in error:", err?.message || err);
      });
    });
  }

  const googleSignOutBtn = document.getElementById("googleSignOutBtn");
  if (googleSignOutBtn) {
    googleSignOutBtn.addEventListener("click", () => {
      signOutUser();
    });
  }
});

async function handleAuthState(user) {
  const signInBtn = document.getElementById("googleSignInBtn");
  const signOutBtn = document.getElementById("googleSignOutBtn");
  const userLabel = document.getElementById("googleUserLabel");

  if (user) {
    setSyncStatus("Syncing...", "warn", 0);
    if (signInBtn) signInBtn.classList.add("hidden");
    if (signOutBtn) signOutBtn.classList.remove("hidden");
    if (userLabel) {
      userLabel.textContent = `Signed in as ${user.displayName || user.email || "User"}`;
      userLabel.classList.remove("hidden");
    }

    let profile = null;
    try {
      profile = await fetchUserProfile(user.uid);
    } catch {
      setSyncStatus("Profile sync failed", "error", 2500);
    }
    const currentUser = {
      user_id: user.uid,
      user_name: profile?.user_name || user.displayName || user.email || "User",
      user_reg_data: profile?.user_reg_data || new Date().toLocaleDateString(),
      vocabulary: profile?.vocabulary || [],
      avatar: profile?.avatar || "",
    };
    localStorage.setItem("currentUser", JSON.stringify(currentUser));

    try {
      if (!profile) {
        await saveUserProfile(user.uid, {
          user_name: currentUser.user_name,
          user_reg_data: currentUser.user_reg_data,
          vocabulary: currentUser.vocabulary,
          avatar: currentUser.avatar,
        });
      }

      const cloudProgress = await fetchCloudProgress(user.uid);
      localStorage.setItem(
        "userProgressList",
        JSON.stringify([
          { user_id: user.uid, guessed_words: cloudProgress || [] },
        ])
      );
      setSyncStatus("Synced", "ok", 1500);
    } catch {
      setSyncStatus("Sync failed", "error", 2500);
    }

    document.getElementById("profilePage").classList.add("hidden");
    document.getElementById("gamePage").classList.remove("hidden");
    displayUserInfo();
    showWord();
  } else {
    setSyncStatus("", "info", 0);
    if (signInBtn) signInBtn.classList.remove("hidden");
    if (signOutBtn) signOutBtn.classList.add("hidden");
    if (userLabel) userLabel.classList.add("hidden");

    localStorage.removeItem("currentUser");
    document.getElementById("gamePage").classList.add("hidden");
    document.getElementById("profilePage").classList.remove("hidden");
  }
}
