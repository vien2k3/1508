const audio = document.getElementById("audio");
const bar = document.getElementById("progress-bar");
const fill = document.getElementById("progress-fill");
const thumb = document.getElementById("progress-thumb");
const currentTimeEl = document.getElementById("current-time");
const durationEl = document.getElementById("duration");
const lyricsEl = document.getElementById("lyrics");
const canvas = document.getElementById("waveform");
const ctx = canvas.getContext("2d");
const playlist = document.getElementById("playlist");
const titleEl = document.getElementById("song-title");
const artistEl = document.getElementById("artist-name");

let lyricsData = [];
let currentLineIndex = -1;
let currentTrack = null;

// 🔊 Setup Web Audio
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioCtx.createAnalyser();
const source = audioCtx.createMediaElementSource(audio);
source.connect(analyser);
analyser.connect(audioCtx.destination);
analyser.fftSize = 1024;
const bufferLength = analyser.fftSize;
const dataArray = new Uint8Array(bufferLength);

function drawWaveform() {
  requestAnimationFrame(drawWaveform);
  analyser.getByteTimeDomainData(dataArray);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
  gradient.addColorStop(0, "#00c6ff");
  gradient.addColorStop(1, "#92fe9d");

  ctx.beginPath();
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 2;

  const sliceWidth = canvas.width / bufferLength;
  let x = 0;

  for (let i = 0; i < bufferLength; i++) {
    const v = dataArray[i] / 128.0;
    const y = (v * canvas.height) / 2;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
    x += sliceWidth;
  }

  ctx.stroke();
}

// ⏱ Format thời gian
function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// 🧠 Load LRC
async function loadLRC(url) {
  const res = await fetch(url);
  const text = await res.text();
  const lines = text.split("\n");
  const map = new Map();

  for (let line of lines) {
    const match = line.match(/\[(\d+):(\d+\.\d+)\](.*)/);
    if (!match) continue;
    const time = parseInt(match[1]) * 60 + parseFloat(match[2]);
    const content = match[3].trim();
    if (!map.has(time)) map.set(time, []);
    map.get(time).push(content);
  }

  return Array.from(map.entries())
    .map(([time, text]) => ({ time, text }))
    .sort((a, b) => a.time - b.time);
}

// 📝 Render lyric
function renderLyrics(data) {
  lyricsEl.innerHTML = "";
  data.forEach((entry, i) => {
    const div = document.createElement("div");
    div.className = "lyric-line";
    div.dataset.index = i;

    const original = document.createElement("div");
    original.className = "line-original";
    original.textContent = entry.text[0] || "";

    const translation = document.createElement("div");
    translation.className = "line-translation";
    translation.textContent = entry.text[1] || "";

    div.appendChild(original);
    div.appendChild(translation);
    lyricsEl.appendChild(div);
  });
}

// ✨ Cập nhật lyric theo thời gian
function updateLyrics(time) {
  const idx = lyricsData.findIndex((l, i) =>
    time >= l.time &&
    (i === lyricsData.length - 1 || time < lyricsData[i + 1].time)
  );

  if (idx !== -1 && idx !== currentLineIndex) {
    currentLineIndex = idx;
    const lines = document.querySelectorAll(".lyric-line");
    lines.forEach((line, i) =>
      line.classList.toggle("current", i === idx)
    );
    lines[idx]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

// ⏯ Xử lý thời gian + tiến trình
audio.ontimeupdate = () => {
  if (!audio.duration) return;
  const percent = (audio.currentTime / audio.duration) * 100;
  fill.style.width = `${percent}%`;
  thumb.style.left = `${percent}%`;
  currentTimeEl.textContent = formatTime(audio.currentTime);
  updateLyrics(audio.currentTime);
};

audio.onloadedmetadata = () => {
  durationEl.textContent = formatTime(audio.duration);
};

audio.onended = () => {
  const next = playlist.querySelector("li.active")?.nextElementSibling;
  if (next) next.click();
};

audio.onplay = () => {
  if (audioCtx.state === "suspended") audioCtx.resume();
  drawWaveform();
};

// 📌 Click tua
bar.addEventListener("click", (e) => {
  const rect = bar.getBoundingClientRect();
  const percent = (e.clientX - rect.left) / rect.width;
  audio.currentTime = percent * audio.duration;
});

// 🎵 Playlist
playlist.addEventListener("click", (e) => {
  const item = e.target.closest("li");
  if (!item) return;

  playlist.querySelectorAll("li").forEach(li => li.classList.remove("active"));
  item.classList.add("active");

  const src = item.dataset.src;
  const lrc = item.dataset.lrc;

  audio.src = src;
  audio.load();
  fill.style.width = "0%";
  thumb.style.left = "0%";
  currentLineIndex = -1;
  currentTimeEl.textContent = "0:00";
  durationEl.textContent = "0:00";

  // Cập nhật tiêu đề nếu muốn
  titleEl.textContent = item.textContent.split("–")[0]?.trim();
  artistEl.textContent = "🎙 " + (item.textContent.split("–")[1] || "").trim();

  loadLRC(lrc).then(data => {
    lyricsData = data;
    renderLyrics(data);
  });
});

const themes = {
  dark: {
    "--primary": "#1db954",
    "--background": "#000",
    "--text": "#fff",
    "--overlay": "rgba(255,255,255,0.05)",
    "--gradient1": "#00ffff",
    "--gradient2": "#ffcc66"
  },
  light: {
    "--primary": "#0077ff",
    "--background": "#fefefe",
    "--text": "#111",
    "--overlay": "rgba(0,0,0,0.05)",
    "--gradient1": "#0077ff",
    "--gradient2": "#ff6600"
  },
  neon: {
    "--primary": "#ff00ff",
    "--background": "#0f0f0f",
    "--text": "#fff",
    "--overlay": "rgba(255,255,255,0.08)",
    "--gradient1": "#00ffff",
    "--gradient2": "#ff00ff"
  },
  spotify: {
    "--primary": "#1db954",
    "--background": "#121212",
    "--text": "#fff",
    "--overlay": "rgba(255,255,255,0.03)",
    "--gradient1": "#1db954",
    "--gradient2": "#1ed760"
  }
};

const themeSelect = document.getElementById("theme-select");
themeSelect.addEventListener("change", (e) => {
  const selected = themes[e.target.value];
  for (let key in selected) {
    document.documentElement.style.setProperty(key, selected[key]);
  }
});

// Toggle icon khi play/pause
const playBtn = document.getElementById("play-btn");
const playIcon = document.getElementById("play-icon");

playBtn.addEventListener("click", () => {
  if (audio.paused) {
    audio.play();
    playIcon.innerHTML = '<rect x="18" y="10" width="10" height="44" fill="white"/><rect x="36" y="10" width="10" height="44" fill="white"/>';
  } else {
    audio.pause();
    playIcon.innerHTML = '<polygon points="16,10 52,32 16,54" fill="white"/>';
  }

  // Hiệu ứng ripple
  const ripple = document.createElement("span");
  ripple.className = "ripple";
  ripple.style.left = "50%";
  ripple.style.top = "50%";
  ripple.style.transform = "translate(-50%, -50%) scale(0)";
  playBtn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
});