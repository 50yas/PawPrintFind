
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth, signInAnonymously } from "firebase/auth";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load env vars
dotenv.config();

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const auth = getAuth(app);

async function uploadImage() {
    try {
        console.log("Signing in anonymously...");
        await signInAnonymously(auth);
        console.log("Signed in.");

        const fileName = "50.jpg";
        const localPath = path.resolve("public", fileName); // It was moved to public/

        if (!fs.existsSync(localPath)) {
            console.error(`File not found at ${localPath}`);
            // Try root just in case
            if (fs.existsSync(fileName)) {
                console.log("Found in root, using that.");
            } else {
                console.error("File not found in root either.");
                process.exit(1);
            }
        }

        const fileBuffer = fs.readFileSync(localPath);
        // target path: uploads/assets/50.jpg
        const storagePath = "uploads/assets/50.jpg";
        const storageRef = ref(storage, storagePath);

        console.log(`Uploading ${fileName} to ${storagePath}...`);
        const snapshot = await uploadBytes(storageRef, fileBuffer, { contentType: 'image/jpeg' });
        console.log("Upload complete!");

        const url = await getDownloadURL(snapshot.ref);
        console.log("Download URL:", url);

    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

uploadImage();
