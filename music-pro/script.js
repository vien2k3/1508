const audio = document.getElementById("audio");
const playBtn = document.getElementById("play-btn");
const lyricsBox = document.getElementById("lyrics-box");
const progressBar = document.getElementById("progress-bar");
const progressFill = document.getElementById("progress-fill");
const progressThumb = document.getElementById("progress-thumb");
const songTitle = document.getElementById("song-title");
const nextBtn = document.getElementById("next-btn");
const prevBtn = document.getElementById("prev-btn");

let wordElements = [];
const songs = [
  { title: "Sky Full of Stars", src: "songs/song1.mp3", lrc: "songs/song1.lrc" },
  { title: "Faded", src: "songs/song2.mp3", lrc: "songs/song2.lrc" }
];
let currentIndex = 0;

function loadSong(index, autoplay = true) {
  const song = songs[index];
  songTitle.textContent = `🎵 Bài hát: ${song.title}`;
  audio.src = song.src;
  lyricsBox.innerHTML = "";
  wordElements = [];

  fetch(song.lrc)
    .then(res => res.text())
    .then(renderKaraoke)
    .then(() => {
      if (autoplay) audio.play();
    });
}

// ▶️ Next / Prev
nextBtn.addEventListener("click", () => {
  currentIndex = (currentIndex + 1) % songs.length;
  loadSong(currentIndex);
});
prevBtn.addEventListener("click", () => {
  currentIndex = (currentIndex - 1 + songs.length) % songs.length;
  loadSong(currentIndex);
});

// ▶️ Play/Pause
playBtn.addEventListener("click", () => {
  if (!audio.src) return;
  audio.paused ? audio.play() : audio.pause();
});
audio.addEventListener("play", () => (playBtn.textContent = "⏸️"));
audio.addEventListener("pause", () => (playBtn.textContent = "▶️"));

// 🕘 Update progress bar
audio.ontimeupdate = () => {
  highlight(audio.currentTime);
  if (!audio.duration) return;
  const percent = (audio.currentTime / audio.duration) * 100;
  progressFill.style.width = `${percent}%`;
  progressThumb.style.left = `${percent}%`;
};

// 🖱️ Click to seek
progressBar.addEventListener("click", e => {
  if (!audio.duration) return;
  const rect = progressBar.getBoundingClientRect();
  const percent = (e.clientX - rect.left) / rect.width;
  audio.currentTime = percent * audio.duration;
});

// 🎤 Render lyrics
function renderKaraoke(text) {
  const lines = text.split("\n");
  const gradients = [
    ["#1db954", "#1ed760"],
    ["#ff7675", "#ffeaa7"],
    ["#70a1ff", "#7bed9f"],
    ["#e84393", "#fab1a0"],
    ["#a29bfe", "#81ecec"]
  ];
  let count = 0;

  lines.forEach(line => {
    const match = line.match(/\[(\d+):(\d+\.\d+)\](.+)/);
    if (!match) return;
    const lineDiv = document.createElement("div");
    lineDiv.className = "karaoke-line";
    const [c1, c2] = gradients[count % gradients.length];
    lineDiv.style.setProperty("--color1", c1);
    lineDiv.style.setProperty("--color2", c2);
    count++;

    const tokens = match[3].match(/<(\d+):(\d+\.\d+)>(\S+)/g);
    if (!tokens) return;

    tokens.forEach(token => {
      const [, min, sec, word] = token.match(/<(\d+):(\d+\.\d+)>(\S+)/);
      const time = parseInt(min) * 60 + parseFloat(sec);

      const span = document.createElement("span");
      span.className = "karaoke-word";
      span.dataset.time = time;
      span.dataset.reflect = word;
      span.textContent = word;

      wordElements.push(span);
      lineDiv.appendChild(span);
      lineDiv.appendChild(document.createTextNode(" "));
    });

    lyricsBox.appendChild(lineDiv);
  });
}

// ✨ Highlight and scroll
function highlight(currentTime) {
  let current = null;
  wordElements.forEach((word, i) => {
    const t = parseFloat(word.dataset.time);
    const next = i + 1 < wordElements.length ? parseFloat(wordElements[i + 1].dataset.time) : Infinity;
    const line = word.closest(".karaoke-line");
    line?.classList.remove("active");
    word.classList.remove("active");
    if (currentTime >= t && currentTime < next) current = word;
  });

  if (current) {
    current.classList.add("active");
    const line = current.closest(".karaoke-line");
    line?.classList.add("active");
    current.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

// 🚀 Auto start
loadSong(currentIndex);