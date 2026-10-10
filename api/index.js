// Vercel Serverless Function: seluruh backend Express dilayani lewat satu fungsi ini.
// vercel.json mengarahkan semua request /api/* ke sini.
import app from "../server/app.js";

export default app;
