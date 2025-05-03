let player;
const form = document.getElementById('addForm');
const nameInput = document.getElementById('lectureName');
const urlInput = document.getElementById('youtubeUrl');
const listEl = document.getElementById('videoList');
const statusEl = document.getElementById('statusText');
const audioPlayer = document.getElementById('audioPlayer');
const manualBtn = document.getElementById('manualToggle');
let currentIndex = null;

// Initialize YouTube Player API
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: '360', width: '640', videoId: '',
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onStateChange
    }
  });
}

// When player is ready, restore last state
function onPlayerReady() {
  renderList();
  const videos = loadAll();
  if (videos.length) loadVideo(videos[0], 0);
}

// Extract video ID
function extractID(url) {
  const re = /(?:youtu\.be\/|[?&]v=)([\w-]{11})/;
  const m = url.match(re);
  return m ? m[1] : null;
}

// Handle player state changes
function onStateChange(e) {
  if (e.data === YT.PlayerState.PLAYING) controlAudio(false);
  if (e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.ENDED) controlAudio(true);
}

// Play or pause audio
function controlAudio(shouldPlay) {
  if (shouldPlay) {
    audioPlayer.play();
    statusEl.textContent = 'Audio playing';
  } else {
    audioPlayer.pause();
    statusEl.textContent = 'Audio paused';
  }
}
// Manual toggle
manualBtn.addEventListener('click', () => {
  if (audioPlayer.paused) controlAudio(true);
  else controlAudio(false);
});

// LocalStorage helpers
function saveAll(videos) { localStorage.setItem('videos', JSON.stringify(videos)); }
function loadAll() { return JSON.parse(localStorage.getItem('videos')||'[]'); }

// Render video list
function renderList() {
  listEl.innerHTML = '';
  loadAll().forEach((v, i) => {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.textContent = `${v.name} (${formatTime(v.time)})`;
    const btn = document.createElement('button');
    btn.textContent = '▶';
    btn.onclick = () => loadVideo(v, i);
    li.append(span, btn);
    listEl.append(li);
  });
}

// Format seconds to h m s
function formatTime(s) {
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = Math.floor(s%60);
  return `${h?h+'h ':''}${m}m ${sec}s`;
}

// Add video
form.addEventListener('submit', e => {
  e.preventDefault();
  const id = extractID(urlInput.value.trim());
  if (!id) return statusEl.textContent = 'Invalid URL';
  const videos = loadAll();
  videos.unshift({ name: nameInput.value.trim(), id, time: 0 });
  saveAll(videos); renderList();
  nameInput.value = urlInput.value = '';
  statusEl.textContent = 'Video added';
});

// Load a video and set current index
function loadVideo(v, i) {
  currentIndex = i;
  player.loadVideoById(v.id, v.time);
  statusEl.textContent = `Loaded: ${v.name}`;
}

// Auto-save playback time
setInterval(() => {
  if (player && player.getCurrentTime && currentIndex !== null) {
    const videos = loadAll();
    videos[currentIndex].time = player.getCurrentTime();
    saveAll(videos);
    renderList();
  }
}, 5000);

