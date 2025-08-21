import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

type ServiceAccountEnv = {
	FIREBASE_PROJECT_ID?: string;
	FIREBASE_CLIENT_EMAIL?: string;
	FIREBASE_PRIVATE_KEY?: string;
};

function getServiceAccountFromEnv(): ServiceAccountEnv {
	return {
		FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
		FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
		FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
	};
}

export function getAdminDb() {
	if (!getApps().length) {
		const sa = getServiceAccountFromEnv();
		if (sa.FIREBASE_PROJECT_ID && sa.FIREBASE_CLIENT_EMAIL && sa.FIREBASE_PRIVATE_KEY) {
			initializeApp({
				credential: cert({
					projectId: sa.FIREBASE_PROJECT_ID,
					clientEmail: sa.FIREBASE_CLIENT_EMAIL,
					privateKey: sa.FIREBASE_PRIVATE_KEY,
				}),
			});
		} else {
			// Fallback: try default credentials (e.g., GOOGLE_APPLICATION_CREDENTIALS)
			initializeApp();
		}
	}
	return getFirestore();
}


