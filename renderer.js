// References to video player and UI elements
const videoPlayer = document.getElementById('video-player');
const fileSelector = document.getElementById('file-selector');
const videoList = document.getElementById('video-list');
const controls = document.getElementById('controls');
const aspectRatioSelector = document.getElementById('aspect-ratio-selector'); 
const ipAddressDisplay = document.getElementById('ip-address-display');

let videoFiles = [];
let currentVideoIndex = 0;
let isMuted = false;
let isFullscreen = false;
let isStopped = false;

// Aspect ratio options
const aspectRatios = [
    "Default",
    "16:9",
    "4:3",
    "1:1",
    "16:10",
    "2.21:1",
    "2.35:1",
    "2.39:1",
    "5:4"
];

const aspectRatioValues = {
    "Default": null,
    "16:9": 16 / 9,
    "4:3": 4 / 3,
    "1:1": 1 / 1,
    "16:10": 16 / 10,
    "2.21:1": 2.21 / 1,
    "2.35:1": 2.35 / 1,
    "2.39:1": 2.39 / 1,
    "5:4": 5 / 4
};

let currentAspectRatioIndex = 0;

// Event listeners for control buttons
document.getElementById('play-btn').addEventListener('click', playVideo);
document.getElementById('pause-btn').addEventListener('click', pauseResumeVideo);
document.getElementById('next-btn').addEventListener('click', nextVideo);
document.getElementById('prev-btn').addEventListener('click', prevVideo);
document.getElementById('stop-btn').addEventListener('click', stopVideo);
document.getElementById('fullscreen-btn').addEventListener('click', toggleFullscreen);
document.getElementById('mute-btn').addEventListener('click', toggleMuteUnmute);
document.getElementById('exit-btn').addEventListener('click', () => {
    window.electronAPI.closeWindow();
});
document.getElementById('minimize-btn').addEventListener('click', () => {
    window.electronAPI.minimizeWindow();
});
document.getElementById('maximize-btn').addEventListener('click', () => {
    window.electronAPI.maximizeWindow();
});

// Load selected files
fileSelector.setAttribute('accept', 'video/*');  // Accept only video files
fileSelector.addEventListener('change', (event) => {
    videoFiles = Array.from(event.target.files).filter(file => file.type.startsWith('video/'));
    currentVideoIndex = 0;
    updateVideoList();
    if (videoFiles.length > 0) {
        loadVideo(currentVideoIndex);
    }
});

// Handle files received via HTTP (from Android)
window.electronAPI.onFileReceived((event, file) => {
    addFileToPlaylist(file.filePath, file.fileName);
});

// Add received file to playlist
function addFileToPlaylist(filePath, fileName) {
    const formattedPath = `file://${filePath}`;  // Format the file path to be a valid file URI
    videoFiles.push({ name: fileName, path: formattedPath });
    updateVideoList();

    // Automatically play the newly added file
    loadVideo(videoFiles.length - 1);
}

// Update video list UI
function updateVideoList() {
    videoList.innerHTML = '';
    videoFiles.forEach((file, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = file.name;
        videoList.appendChild(listItem);
        listItem.addEventListener('click', () => {
            currentVideoIndex = index;
            loadVideo(index);
        });
    });
}

// Load and play a video by index
function loadVideo(index) {
    if (videoFiles.length > 0) {
        videoPlayer.src = videoFiles[index].path;
        videoPlayer.play();
        hideVideoList();  // Hide the list when the video starts playing
        isStopped = false; // Reset the stopped flag
    }
}

// Play video
function playVideo() {
    if (isStopped && videoFiles.length > 0) {
        loadVideo(currentVideoIndex); // Reload the video if it was stopped
    } else if (videoFiles.length > 0 && videoPlayer.src) {
        videoPlayer.play();
    } else if (videoFiles.length > 0) {
        loadVideo(currentVideoIndex);
    }
}

// Pause or resume video
function pauseResumeVideo() {
    if (videoPlayer.paused) {
        videoPlayer.play();
    } else {
        videoPlayer.pause();
    }
}

// Play next video in the list
function nextVideo() {
    currentVideoIndex = (currentVideoIndex + 1) % videoFiles.length;
    loadVideo(currentVideoIndex);
}

// Play previous video in the list
function prevVideo() {
    currentVideoIndex = (currentVideoIndex - 1 + videoFiles.length) % videoFiles.length;
    loadVideo(currentVideoIndex);
}

// Stop the video and reset
function stopVideo() {
    videoPlayer.pause();
    videoPlayer.currentTime = 0;
    videoPlayer.src = '';  // Clear the video source to reset the player
    showVideoList();  // Show the list again after stopping
    isStopped = true; // Set the stopped flag
}

// Mute or unmute the video
function toggleMuteUnmute() {
    isMuted = !isMuted;
    videoPlayer.muted = isMuted;
    document.getElementById('mute-btn').textContent = isMuted ? 'Unmute' : 'Mute';
}

// Hide video list when a video is playing
function hideVideoList() {
    videoList.style.display = 'none';
    ipAddressDisplay.style.display = 'none';
}

// Show video list when no video is playing
function showVideoList() {
    videoList.style.display = 'block';
    ipAddressDisplay.style.display = 'block';
}

// Toggle fullscreen and hide/show controls
function toggleFullscreen() {
    isFullscreen = !isFullscreen;
    window.electronAPI.toggleFullscreen();
    controls.style.display = isFullscreen ? 'none' : 'flex';
}

// Handle aspect ratio change
aspectRatioSelector.addEventListener('change', () => {
    setAspectRatio(aspectRatioSelector.value);
});

// Cycle through aspect ratios when "a" is pressed
document.addEventListener('keydown', (event) => {
    if (event.key === 'a' || event.key === 'A') {
        currentAspectRatioIndex = (currentAspectRatioIndex + 1) % aspectRatios.length;
        const selectedAspectRatio = aspectRatios[currentAspectRatioIndex];
        aspectRatioSelector.value = selectedAspectRatio; // Update dropdown to reflect change
        setAspectRatio(selectedAspectRatio);
    }
});

function setAspectRatio(ratioKey) {
    const aspectRatio = aspectRatioValues[ratioKey];
    if (aspectRatio) {
        const height = videoPlayer.clientHeight;
        const newWidth = Math.round(height * aspectRatio);
        videoPlayer.style.width = `${newWidth}px`;
        videoPlayer.style.height = `${height}px`;
    } else {
        videoPlayer.style.width = '';  // Reset to default width
        videoPlayer.style.height = '';  // Reset to default height
    }
}

// Handle end of video and loop to the next
videoPlayer.addEventListener('ended', nextVideo);

// Keyboard shortcuts
document.addEventListener('keydown', (event) => {
    switch(event.key) {
        case 'm':  // Minimize or maximize window
            window.electronAPI.toggleMaximize();
            break;
        case 'f':  // Fullscreen
            toggleFullscreen();
            break;
        case 'n':  // Next video
            nextVideo();
            break;
        case 'p':  // Previous video
            prevVideo();
            break;
        case ' ':  // Spacebar for pause/resume
            pauseResumeVideo();
            break;
        case 'Escape':  // Exit fullscreen
            if (isFullscreen) {
                toggleFullscreen();
            }
            break;
    }
});

// Listen for the IPv4 address from the main process
window.electronAPI.onIPv4Address((event, ipv4Address) => {
    ipAddressDisplay.textContent = `IP Address: ${ipv4Address}`;
    ipAddressDisplay.style.display = 'block'; // Ensure it's visible
});

// Handle control commands received from the Android app
// window.electronAPI.onControlCommand('control-command', (event, command) => {
//     switch (command) {
//         case 'play':
//             playVideo();
//             break;
//         case 'pause_resume':
//             pauseResumeVideo();
//             break;
//         case 'next':
//             nextVideo();
//             break;
//         case 'previous':
//             prevVideo();
//             break;
//         case 'stop':
//             stopVideo();
//             break;
//         case 'fullscreen':
//             toggleFullscreen();
//             break;
//         case 'mute_unmute':
//             toggleMuteUnmute();
//             break;
//         case 'exit':
//             window.electronAPI.closeWindow();
//             break;
//         case 'aspect_ratio':
//             currentAspectRatioIndex = (currentAspectRatioIndex + 1) % aspectRatios.length;
//             const selectedAspectRatio = aspectRatios[currentAspectRatioIndex];
//             aspectRatioSelector.value = selectedAspectRatio;
//             setAspectRatio(selectedAspectRatio);
//             break;
//         default:
//             console.log(`Unknown command: ${command}`);
//     }
// });

window.electronAPI.onControlCommand((command) => {
    switch (command) {
        case 'play':
            playVideo();
            break;
        case 'pause_resume':
            pauseResumeVideo();
            break;
        case 'next':
            nextVideo();
            break;
        case 'previous':
            prevVideo();
            break;
        case 'stop':
            stopVideo();
            break;
        case 'fullscreen':
            toggleFullscreen();
            break;
        case 'mute_unmute':
            toggleMuteUnmute();
            break;
        case 'exit':
            window.electronAPI.closeWindow();
            break;
        case 'aspect_ratio':
            currentAspectRatioIndex = (currentAspectRatioIndex + 1) % aspectRatios.length;
            const selectedAspectRatio = aspectRatios[currentAspectRatioIndex];
            aspectRatioSelector.value = selectedAspectRatio;
            setAspectRatio(selectedAspectRatio);
            break;
        default:
            console.log(`Unknown command: ${command}`);
    }
});
