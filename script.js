const BIN_ID = '6815be958a456b7966969edb';
const API_KEY = '$2a$10$R3.wwOYbenUEFkJ1MIlP0u4KMas5pWfF0kcIbbbIav63MMftYkqBK'; // Or leave empty if bin is public
const READ_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}/latest`;
const WRITE_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

let player, currentIndex = null;
const form = document.getElementById('addForm');
const nameInput = document.getElementById('lectureName');
const urlInput = document.getElementById('youtubeUrl');
const listEl = document.getElementById('videoList');
const statusEl = document.getElementById('statusText');
const audioPlayer = document.getElementById('audioPlayer');
const manualBtn = document.getElementById('manualToggle');

// ========== JSONBin Load & Save ==========

async function loadAll() {
  const res = await fetch(READ_URL, {
    headers: {
      'X-Master-Key': API_KEY
    }
  });
  const { record } = await res.json();
  return record.videos || [];
}

async function saveAll(videos) {
  await fetch(WRITE_URL, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': API_KEY
    },
    body: JSON.stringify({ videos })
  });
}

// ========== DOM & UI Logic ==========

function extractID(url) {
  const match = url.match(/(?:v=|youtu\.be\/)([^&\n?#]+)/);
  return match ? match[1] : null;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function controlAudio(pause) {
  if (pause) {
    audioPlayer.pause();
  } else {
    audioPlayer.play().catch(() => {});
  }
}

manualBtn.addEventListener('click', () => {
  if (audioPlayer.paused) audioPlayer.play();
  else audioPlayer.pause();
});

async function renderList() {
  const videos = await loadAll();
  listEl.innerHTML = '';
  videos.forEach((v, i) => {
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

async function loadVideo(video, index) {
  currentIndex = index;
  if (player) player.loadVideoById({ videoId: video.id, startSeconds: video.time });
  else initPlayer(video.id, video.time);
  controlAudio(true);
}

// ========== YouTube Player API ==========

function initPlayer(videoId, start = 0) {
  if (player) return;
  player = new YT.Player('player', {
    height: '390',
    width: '640',
    videoId: videoId,
    playerVars: { start },
    events: {
      'onStateChange': onPlayerStateChange
    }
  });
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.PLAYING) controlAudio(true);
  if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) controlAudio(false);
}

// ========== Add Video ==========

form.addEventListener('submit', async e => {
  e.preventDefault();
  const id = extractID(urlInput.value.trim());
  if (!id) return statusEl.textContent = 'Invalid YouTube URL';
  const videos = await loadAll();
  videos.unshift({ name: nameInput.value.trim(), id, time: 0 });
  await saveAll(videos);
  nameInput.value = urlInput.value = '';
  statusEl.textContent = 'Video added!';
  renderList();
});

// ========== Save Timestamp ==========

setInterval(async () => {
  if (player && player.getCurrentTime && currentIndex !== null) {
    const videos = await loadAll();
    videos[currentIndex].time = player.getCurrentTime();
    await saveAll(videos);
  }
}, 5000);

// ========== On Load ==========
window.onload = () => {
  renderList();
};
