// References to video player and UI elements
const videoPlayer = document.getElementById('video-player');
const fileSelector = document.getElementById('file-selector');
const videoList = document.getElementById('video-list');
const controls = document.getElementById('controls');
const aspectRatioSelector = document.getElementById('aspect-ratio-selector'); // New element for aspect ratio

let videoFiles = [];
let currentVideoIndex = 0;
let isMuted = false;
let isFullscreen = false;
let isStopped = false; // New flag to track if the video was stopped

// Aspect ratio options
const aspectRatios = {
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
        videoPlayer.src = URL.createObjectURL(videoFiles[index]);
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
}

// Show video list when no video is playing
function showVideoList() {
    videoList.style.display = 'block';
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

function setAspectRatio(ratioKey) {
    const aspectRatio = aspectRatios[ratioKey];
    if (aspectRatio) {
        videoPlayer.style.width = `calc(${aspectRatio} * 100vh)`;  // Set width based on aspect ratio
        videoPlayer.style.height = '100vh';  // Full height
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
