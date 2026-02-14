// WordGameM/www/js/firebaseAuth.js

import {
  browserLocalPersistence,
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { auth } from "./firebaseClient.js";

let currentUser = null;

export function getCurrentUser() {
  return currentUser;
}

export async function initAuth(onUserChanged) {
  await setPersistence(auth, browserLocalPersistence);

  try {
    await getRedirectResult(auth);
  } catch (err) {
    console.warn("Redirect sign-in failed:", err?.message || err);
  }

  onAuthStateChanged(auth, (user) => {
    currentUser = user || null;
    if (typeof onUserChanged === "function") {
      onUserChanged(currentUser);
    }
  });
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export function signOutUser() {
  return signOut(auth);
}
