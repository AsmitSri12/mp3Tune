const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { convertToMp3 } = require("./utils/converter");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const TEMP_DIR = process.env.TEMP_DIR || path.join(__dirname, "temp");

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Auto-update yt-dlp binary on startup to bypass Render's node_modules cache
try {
  const { execSync } = require("child_process");
  const ytdlPath = require("youtube-dl-exec/src/constants").YOUTUBE_DL_PATH;
  console.log("Updating yt-dlp binary to the latest version...");
  execSync(`"${ytdlPath}" -U`, { stdio: "inherit" });
  console.log("yt-dlp update check complete.");
} catch (e) {
  console.error("Failed to auto-update yt-dlp:", e.message);
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Cleanup older files periodically (every hour)
setInterval(() => {
  fs.readdir(TEMP_DIR, (err, files) => {
    if (err) return console.error("Error reading temp dir for cleanup:", err);
    const now = Date.now();
    files.forEach((file) => {
      const filePath = path.join(TEMP_DIR, file);
      fs.stat(filePath, (err, stats) => {
        if (err) return;
        // Delete files older than 1 hour
        if (now - stats.mtimeMs > 3600000) {
          fs.unlink(filePath, () => {});
        }
      });
    });
  });
}, 3600000);

app.post("/api/convert", async (req, res) => {
  const { url } = req.body;

  if (!url || !url.includes("youtu")) {
    return res.status(400).json({ error: "Invalid YouTube URL." });
  }

  try {
    const { fileId, title } = await convertToMp3(url, TEMP_DIR);
    res.json({ success: true, fileId, title });
  } catch (error) {
    console.error("Conversion error:", error);
    res
      .status(500)
      .json({ error: error.message || "An error occurred during conversion." });
  }
});

app.get("/api/download/:id", (req, res) => {
  const fileId = req.params.id;
  // Basic sanitization
  if (!/^[a-zA-Z0-9-]+$/.test(fileId)) {
    return res.status(400).send("Invalid file ID.");
  }

  const filePath = path.join(TEMP_DIR, `${fileId}.mp3`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found or expired.");
  }

  const title = req.query.title || "audio";
  const safeTitle =
    title
      .replace(/[^\w\s-]/g, "")
      .trim()
      .substring(0, 100) || "audio";

  res.download(filePath, `${safeTitle}.mp3`, (err) => {
    if (err) {
      console.error("Download error:", err);
    } else {
      // Delete after download
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) console.error("Error deleting file:", unlinkErr);
      });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`\n🎵 Access your app here: http://localhost:${PORT}\n`);
});
