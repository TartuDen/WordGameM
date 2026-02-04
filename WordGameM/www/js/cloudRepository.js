// WordGameM/www/js/cloudRepository.js

import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  setDoc,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { db } from "./firebaseClient.js";

export async function fetchUserProfile(uid) {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  return snap.exists() ? snap.data() : null;
}

export async function saveUserProfile(uid, profile) {
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, profile, { merge: true });
}

export async function fetchCloudProgress(uid) {
  const progressRef = collection(db, "users", uid, "progress");
  const snap = await getDocs(progressRef);
  const result = [];
  snap.forEach((docSnap) => {
    const data = docSnap.data();
    if (data && typeof data.word_id !== "undefined") {
      result.push({
        word_id: data.word_id,
        guess_correctly: data.guess_correctly || 0,
        guessed_wrong: data.guessed_wrong || 0,
      });
    }
  });
  return result;
}

export async function syncLocalProgressToCloud(uid, guessedWords) {
  const batch = writeBatch(db);
  guessedWords.forEach((gw) => {
    const ref = doc(db, "users", uid, "progress", String(gw.word_id));
    batch.set(
      ref,
      {
        word_id: gw.word_id,
        guess_correctly: gw.guess_correctly || 0,
        guessed_wrong: gw.guessed_wrong || 0,
      },
      { merge: true }
    );
  });
  await batch.commit();
}

export async function upsertCloudProgress(uid, wordId, isCorrect) {
  const ref = doc(db, "users", uid, "progress", String(wordId));
  const payload = {
    word_id: Number(wordId),
  };
  if (isCorrect) {
    payload.guess_correctly = increment(1);
  } else {
    payload.guessed_wrong = increment(1);
  }
  await setDoc(ref, payload, { merge: true });
}
