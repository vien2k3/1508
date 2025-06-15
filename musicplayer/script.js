const audio = document.getElementById("audio");
const progress = document.getElementById("progress");
const currentTimeEl = document.getElementById("current-time");
const durationEl = document.getElementById("duration");
const lyricsEl = document.getElementById("lyrics");
const canvas = document.getElementById("waveform");
const ctx = canvas.getContext("2d");

let lyricsData = [];
let currentLineIndex = -1;

// Waveform setup
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();
const analyser = audioCtx.createAnalyser();
const source = audioCtx.createMediaElementSource(audio);
source.connect(analyser);
analyser.connect(audioCtx.destination);

analyser.fftSize = 1024;
const bufferLength = analyser.fftSize;
const dataArray = new Uint8Array(bufferLength);

// Vẽ waveform dạng sóng mềm + gradient
function drawWaveform() {
  requestAnimationFrame(drawWaveform);
  analyser.getByteTimeDomainData(dataArray);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
  gradient.addColorStop(0, "#00c6ff");
  gradient.addColorStop(1, "#92fe9d");

  ctx.lineWidth = 2;
  ctx.strokeStyle = gradient;
  ctx.beginPath();

  const sliceWidth = canvas.width / bufferLength;
  let x = 0;

  for (let i = 0; i < bufferLength; i++) {
    const v = dataArray[i] / 128.0;
    const y = (v * canvas.height) / 2;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
    x += sliceWidth;
  }

  ctx.lineTo(canvas.width, canvas.height / 2);
  ctx.stroke();
}

// Audio listeners
audio.onplay = () => {
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  drawWaveform();
};

audio.ontimeupdate = () => {
  const time = audio.currentTime;
  progress.value = time;
  currentTimeEl.textContent = formatTime(time);
  updateLyrics(time);
};

audio.onloadedmetadata = () => {
  progress.max = audio.duration;
  durationEl.textContent = formatTime(audio.duration);
  loadLRC("songs/song1.lrc").then((data) => {
    lyricsData = data;
    renderLyrics();
  });
};

progress.addEventListener("input", () => {
  audio.currentTime = progress.value;
});

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// Load and parse LRC song ngữ
async function loadLRC(url) {
  const res = await fetch(url);
  const text = await res.text();
  const lines = text.split("\n");
  const map = new Map();

  for (const line of lines) {
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

function renderLyrics() {
  lyricsEl.innerHTML = "";
  lyricsData.forEach((line, idx) => {
    const div = document.createElement("div");
    div.className = "lyric-line";
    div.dataset.index = idx;

    const original = document.createElement("div");
    original.className = "line-original";
    original.textContent = line.text[0] || "";

    const translated = document.createElement("div");
    translated.className = "line-translation";
    translated.textContent = line.text[1] || "";

    div.appendChild(original);
    div.appendChild(translated);
    lyricsEl.appendChild(div);
  });
}

function updateLyrics(currentTime) {
  const idx = lyricsData.findIndex((l, i) =>
    currentTime >= l.time &&
    (i === lyricsData.length - 1 || currentTime < lyricsData[i + 1].time)
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