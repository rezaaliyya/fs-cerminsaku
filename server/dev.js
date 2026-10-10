// Dipakai hanya saat `npm run dev` (backend lokal di port 3000).
import "dotenv/config";
import app from "./app.js";

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`CerminSaku API berjalan di http://localhost:${PORT}`);
});
