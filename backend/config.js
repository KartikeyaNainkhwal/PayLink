//backend/config.js
module.exports = {
	// prefer env values; fall back to defaults for local dev
	JWT_SECRET: process.env.JWT_SECRET || "your-jwt-secret",
	// Support either a single GOOGLE_CLIENT_ID or a comma-separated
	// GOOGLE_CLIENT_IDS environment variable (useful if frontend and
	// other clients have different OAuth client IDs).
	GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
	GOOGLE_CLIENT_IDS: (process.env.GOOGLE_CLIENT_IDS || process.env.GOOGLE_CLIENT_ID || "").split(',').map(s => s.trim()).filter(Boolean),
};
