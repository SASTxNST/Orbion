import app from "./app.js";
import dotenv from "dotenv";

dotenv.config();
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
