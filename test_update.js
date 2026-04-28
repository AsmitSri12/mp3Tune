const { execSync } = require('child_process');
const ytdlPath = require('youtube-dl-exec/src/constants').YOUTUBE_DL_PATH;
console.log('Path:', ytdlPath);
try {
    execSync(`"${ytdlPath}" -U`, { stdio: 'inherit' });
} catch(e) {
    console.error(e.message);
}
