import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyCGB8cx6BYu-PavOOcdZ2HIW29KyEV9f_g",
    authDomain: "satgs-2100b.firebaseapp.com",
    projectId: "satgs-2100b",
    appId: "1:390729577621:web:8b1e2cfe30bb13cf86179c",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
