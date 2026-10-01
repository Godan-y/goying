import "dotenv/config";
import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const uid = process.argv[2];
if (!uid) {
  throw new Error("Usage: npm.cmd run set-admin -- <firebase-uid>");
}

if (!getApps().length) initializeApp({ credential: applicationDefault() });

await getAuth().setCustomUserClaims(uid, { admin: true });
console.log(`Custom claim admin=true assigned to ${uid}. The user must sign out and sign in again.`);
