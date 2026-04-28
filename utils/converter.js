const youtubedl = require('youtube-dl-exec');
const ffmpegPath = require('ffmpeg-static');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

async function convertToMp3(url, tempDir) {
    const fileId = uuidv4();
    const finalFile = path.join(tempDir, `${fileId}.mp3`);
    const downloadTemplate = path.join(tempDir, `${fileId}.%(ext)s`);

    try {
        // 1. Get info to check duration
        const info = await youtubedl(url, {
            dumpJson: true,
            noWarnings: true,
        });

        // 2. Limit duration (10 minutes = 600 seconds)
        const MAX_DURATION = 600;
        if (info.duration > MAX_DURATION) {
            throw new Error(`Video exceeds maximum duration of ${MAX_DURATION / 60} minutes.`);
        }

        // 3. Download and extract audio as MP3
        // We use yt-dlp's built-in extraction, pointing it to ffmpeg-static
        await youtubedl(url, {
            extractAudio: true,
            audioFormat: 'mp3',
            ffmpegLocation: ffmpegPath,
            output: downloadTemplate,
            noWarnings: true,
        });

        // The file is saved as <fileId>.mp3 because of --audio-format mp3
        
        // Double check if file exists
        if (!fs.existsSync(finalFile)) {
            throw new Error('Failed to create MP3 file.');
        }

        return { fileId, title: info.title };
    } catch (error) {
        console.error('youtube-dl-exec error:', error);
        // Clean up any partial files if they exist
        if (fs.existsSync(finalFile)) {
            fs.unlinkSync(finalFile);
        }
        throw new Error(error.message || 'Conversion failed.');
    }
}

module.exports = { convertToMp3 };
