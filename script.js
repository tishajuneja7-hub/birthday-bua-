/* =====================================================================
   BUA'S BIRTHDAY — SCRIPT
   ---------------------------------------------------------------------
   HOW TO EDIT THE EASY STUFF:
   - Photo counts / filenames come from the CONFIG block right below.
     If you ever rename your photo files, update the patterns there.
   - The captions and the letter text live directly in index.html
     (search for "group-caption" and "letter-body") — NOT here.
   - Song filenames are set in index.html on the <audio> tags.
   ===================================================================== */

/* ---------------------- CONFIG ---------------------- */
const CONFIG = {
  oldCount: 6,          // assets/old-01.jpg ... old-06.jpg
  childhoodCount: 4,    // assets/childhood-01.jpg ... childhood-04.jpg
  presentCount: 17,     // assets/present-01.jpg ... present-17.jpg
};

function padded(n) { return String(n).padStart(2, '0'); }
function oldSrc(n) { return `assets/old-${padded(n)}.jpg`; }
function childSrc(n) { return `assets/childhood-${padded(n)}.jpg`; }
function presentSrc(n) { return `assets/present-${padded(n)}.jpg`; }

/* ---------------------- SCENE FLOW ---------------------- */
const FLOW = ['opening', 'reveal', 'archives', 'childhood', 'thennow',
              'present', 'letter', 'cake', 'revisit', 'cutting', 'giftbox', 'final'];

let currentIndex = 0;
const scenesBuilt = {}; // guards against re-building photo stages every time a scene is revisited

function goToScene(id) {
  const targetIndex = FLOW.indexOf(id);
  if (targetIndex === -1) return;
  currentIndex = targetIndex;

  document.querySelectorAll('.scene').forEach(el => el.classList.remove('active'));
  const target = document.querySelector(`.scene[data-scene="${id}"]`);
  if (target) target.classList.add('active');

  onSceneEnter(id);
}

function nextScene() {
  if (currentIndex < FLOW.length - 1) {
    goToScene(FLOW[currentIndex + 1]);
  }
}

/* Generic "tap to continue" buttons advance to the next scene,
   EXCEPT the ones inside the letter scene's first step, which are
   wired up separately below because that scene has its own sub-steps. */
document.querySelectorAll('.next-btn').forEach(btn => {
  if (btn.closest('#letterIntroStep')) return;
  btn.addEventListener('click', nextScene);
});

/* =====================================================================
   FLOATING FX LAYER — confetti, hearts, sparkles, balloons
   ===================================================================== */

const fxLayer = document.getElementById('fxLayer');
const FX_COLORS = ['#7A2E3B', '#C97B84', '#C9A15A', '#F3E4D6', '#5C2130'];

function spawnFalling(symbolFn, count, opts = {}) {
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'fx-item';
    el.textContent = symbolFn ? symbolFn() : '';
    if (!symbolFn) {
      el.style.width = opts.size || '8px';
      el.style.height = opts.size || '8px';
      el.style.background = FX_COLORS[Math.floor(Math.random() * FX_COLORS.length)];
      el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    } else {
      el.style.fontSize = opts.fontSize || '18px';
    }
    el.style.left = Math.random() * 96 + '%';
    const duration = 1.8 + Math.random() * 1.6;
    el.style.animationDuration = duration + 's';
    el.style.animationDelay = (Math.random() * 0.4) + 's';
    fxLayer.appendChild(el);
    setTimeout(() => el.remove(), (duration + 0.5) * 1000);
  }
}

function spawnRising(symbolFn, count, opts = {}) {
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'fx-item fx-balloon';
    el.textContent = symbolFn();
    el.style.fontSize = opts.fontSize || '26px';
    el.style.left = Math.random() * 90 + '%';
    const duration = 3 + Math.random() * 2;
    el.style.animationDuration = duration + 's';
    el.style.animationDelay = (Math.random() * 0.5) + 's';
    fxLayer.appendChild(el);
    setTimeout(() => el.remove(), (duration + 0.5) * 1000);
  }
}

const confetti = () => spawnFalling(null, 26);
const sparkles = () => spawnFalling(() => '✦', 16, { fontSize: '14px' });
const hearts = () => spawnRising(() => (Math.random() > 0.5 ? '♡' : '❤'), 12, { fontSize: '22px' });
const balloons = () => spawnRising(() => '🎈', 6, { fontSize: '30px' });

function celebrate() {
  confetti();
  sparkles();
  hearts();
  setTimeout(balloons, 200);
}
/* =====================================================================
   MUSIC — song1 plays first, then song2 starts when the envelope opens
   ===================================================================== */

const song1 = document.getElementById('song1');
const song2 = document.getElementById('song2');
const musicBtn = document.getElementById('musicToggle');

let musicMuted = false;

/* Initial audio settings */
song1.volume = 1;
song2.volume = 1;
song1.muted = false;
song2.muted = false;

/* Show useful errors instead of silently hiding them */
song1.addEventListener('error', () => {
  console.error("ERROR: birthday.mp3 could not be loaded.", song1.error);
});

song2.addEventListener('error', () => {
  console.error("ERROR: letter-song.mp3 could not be loaded.", song2.error);
});

/* Start first song */
function startSong1() {
  song1.volume = 1;
  song1.muted = musicMuted;

  const playPromise = song1.play();

  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        console.log("SUCCESS: birthday.mp3 is playing.");
      })
      .catch(error => {
        console.error("ERROR: birthday.mp3 could not play:", error);
      });
  }
}

/* Start second song when envelope is opened */
async function crossfadeToSong2() {

  console.log("Envelope opened. Starting second song...");
  console.log("Second song source:", song2.currentSrc || song2.src);
  console.log("Second song readyState:", song2.readyState);

  /* Make sure second song is audible */
  song2.volume = 1;
  song2.muted = musicMuted;

  /* Make sure the browser loads the file */
  song2.load();

  try {

    /* Wait until the browser has enough audio data */
    if (song2.readyState < 2) {
      await new Promise((resolve, reject) => {

        const onReady = () => {
          cleanup();
          resolve();
        };

        const onError = () => {
          cleanup();
          reject(new Error("letter-song.mp3 could not be loaded."));
        };

        const cleanup = () => {
          song2.removeEventListener('canplay', onReady);
          song2.removeEventListener('error', onError);
        };

        song2.addEventListener('canplay', onReady, { once: true });
        song2.addEventListener('error', onError, { once: true });
      });
    }

    /* START THE SECOND SONG */
    await song2.play();

    console.log("SUCCESS: letter-song.mp3 is now playing.");

    /* Fade out the first song */
    const steps = 20;
    const stepTime = 60;
    let i = 0;

    const timer = setInterval(() => {

      i++;

      song1.volume = Math.max(0, 1 - i / steps);

      if (i >= steps) {
        clearInterval(timer);

        song1.pause();
        song1.currentTime = 0;
        song1.volume = 1;

        console.log("First song stopped. Second song is playing.");
      }

    }, stepTime);

  } catch (error) {

    console.error("SECOND SONG FAILED TO PLAY:", error);

    /* Keep the first song playing if second song fails */
    song1.volume = 1;
  }
}

/* Music mute/unmute button */
musicBtn.addEventListener('click', () => {

  musicMuted = !musicMuted;

  song1.muted = musicMuted;
  song2.muted = musicMuted;

  musicBtn.textContent = musicMuted ? '🔇' : '🔈';

});

/* =====================================================================
   REUSABLE "RAPID TAP-THROUGH PHOTO STAGE"
   Used by: Bua Archives, Childhood, Present-day, Memory Revisit
   ===================================================================== */

function buildRapidStage(stageEl, images, { showNumbers = false, onAdvance, onComplete } = {}) {
  stageEl.innerHTML = '';
  const frames = images.map((src, i) => {
    const frame = document.createElement('div');
    frame.className = 'stage-photo';
    frame.style.setProperty('--tilt', (Math.random() * 4 - 2).toFixed(1) + 'deg');
    const img = document.createElement('img');
    img.src = src;
    img.alt = 'Memory photo';
    frame.appendChild(img);
    if (showNumbers) {
      const num = document.createElement('span');
      num.className = 'stage-number';
      num.textContent = 'no. ' + padded(i + 1);
      frame.appendChild(num);
    }
    stageEl.appendChild(frame);
    return frame;
  });

  let idx = 0;
  frames[0].classList.add('is-active');
  if (onAdvance) onAdvance(idx, frames.length);

  stageEl.onclick = () => {
    if (idx < frames.length - 1) {
      frames[idx].classList.remove('is-active');
      idx++;
      frames[idx].classList.add('is-active');
      if (onAdvance) onAdvance(idx, frames.length);
    } else {
      if (onComplete) onComplete();
    }
  };
}

/* =====================================================================
   SCENE-SPECIFIC SETUP (runs the first time each scene is entered)
   ===================================================================== */

function onSceneEnter(id) {
  if (id === 'reveal' && !scenesBuilt.reveal) {
    scenesBuilt.reveal = true;
    setTimeout(celebrate, 200);
  }

  if (id === 'archives' && !scenesBuilt.archives) {
    scenesBuilt.archives = true;
    const stage = document.getElementById('archivesStage');
    const hint = document.getElementById('archivesHint');
    const caption = document.getElementById('archivesCaption');
    const images = Array.from({ length: CONFIG.oldCount }, (_, i) => oldSrc(i + 1));
    buildRapidStage(stage, images, {
      showNumbers: true,
      onComplete: () => {
        hint.classList.add('hidden');
        stage.classList.add('hidden');
        caption.classList.remove('hidden');
        sparkles();
      }
    });
  }

  if (id === 'childhood' && !scenesBuilt.childhood) {
    scenesBuilt.childhood = true;
    const stage = document.getElementById('childhoodStage');
    const hint = document.getElementById('childhoodHint');
    const collage = document.getElementById('childhoodCollage');
    const caption = document.getElementById('childhoodCaption');
    const images = Array.from({ length: CONFIG.childhoodCount }, (_, i) => childSrc(i + 1));
    buildRapidStage(stage, images, {
      onComplete: () => {
        hint.classList.add('hidden');
        stage.classList.add('hidden');
        collage.innerHTML = images.map(src => `<img src="${src}" alt="Childhood memory">`).join('');
        collage.classList.remove('hidden');
        caption.classList.remove('hidden');
        hearts();
      }
    });
  }

  if (id === 'thennow' && !scenesBuilt.thennow) {
    scenesBuilt.thennow = true;
    // restart the little text animation each time it's freshly built
  }

  if (id === 'present' && !scenesBuilt.present) {
    scenesBuilt.present = true;
    const stage = document.getElementById('presentStage');
    const hint = document.getElementById('presentHint');
    const counter = document.getElementById('presentCounter');
    const caption = document.getElementById('presentCaption');
    const images = Array.from({ length: CONFIG.presentCount }, (_, i) => presentSrc(i + 1));
    buildRapidStage(stage, images, {
      onAdvance: (i, total) => { counter.textContent = `${i + 1} / ${total}`; },
      onComplete: () => {
        hint.classList.add('hidden');
        stage.classList.add('hidden');
        counter.classList.add('hidden');
        caption.classList.remove('hidden');
        confetti();
      }
    });
  }

  if (id === 'cake' && !scenesBuilt.cake) {
    scenesBuilt.cake = true;
    // song1 -> song2 crossfade happens when the letter scene finishes,
    // so by the time the cake scene appears song2 is already playing.
  }

  if (id === 'revisit' && !scenesBuilt.revisit) {
    scenesBuilt.revisit = true;
    const stage = document.getElementById('revisitStage');
    const hint = document.getElementById('revisitHint');
    const mixed = [
      oldSrc(1), childSrc(1), presentSrc(1),
      oldSrc(3), childSrc(2), presentSrc(5),
      oldSrc(5), childSrc(4), presentSrc(10),
      presentSrc(17)
    ];
    buildRapidStage(stage, mixed, {
      onComplete: () => {
        hint.textContent = 'tap to continue ✦';
        sparkles();
        setTimeout(nextScene, 500);
      }
    });
  }
}

/* =====================================================================
   SCENE 1 — OPENING BUTTON
   ===================================================================== */

document.getElementById('openBtn').addEventListener('click', () => {
  startSong1();
  nextScene();
});

/* =====================================================================
   SCENE 7 — LETTER (intro -> envelope -> paper)
   ===================================================================== */

const letterIntroStep = document.getElementById('letterIntroStep');
const letterEnvelopeStep = document.getElementById('letterEnvelopeStep');
const letterPaperStep = document.getElementById('letterPaperStep');
const envelope = document.getElementById('envelope');

letterIntroStep.querySelector('.next-btn').addEventListener('click', () => {
  letterIntroStep.classList.add('hidden');
  letterEnvelopeStep.classList.remove('hidden');
});

envelope.addEventListener('click', () => {
  if (envelope.classList.contains('open')) return;
  envelope.classList.add('open');
  crossfadeToSong2();
  setTimeout(() => {
    letterEnvelopeStep.classList.add('hidden');
    letterPaperStep.classList.remove('hidden');
    sparkles();
  }, 750);
});

letterPaperStep.querySelector('.next-btn').addEventListener('click', nextScene);

/* =====================================================================
   SCENE 8 — CAKE / BLOW CANDLES
   ===================================================================== */

const blowBtn = document.getElementById('blowBtn');
const candleGroup = document.querySelector('.candle-group');
const cakeMessage = document.getElementById('cakeMessage');
const cakeNext = document.getElementById('cakeNext');

blowBtn.addEventListener('click', () => {
  candleGroup.classList.add('blown');
  blowBtn.classList.add('hidden');
  celebrate();
  setTimeout(() => {
    cakeMessage.classList.remove('hidden');
    cakeNext.classList.remove('hidden');
  }, 500);
});

/* =====================================================================
   SCENE 10 — CAKE CUTTING
   ===================================================================== */

const cutBtn = document.getElementById('cutBtn');
const knife = document.getElementById('knife');
const cutLine = document.getElementById('cutLine');
const cuttingNext = document.getElementById('cuttingNext');

cutBtn.addEventListener('click', () => {
  knife.classList.add('cut');
  cutBtn.classList.add('hidden');
  setTimeout(() => {
    cutLine.setAttribute('stroke-dasharray', '0');
    celebrate();
    cuttingNext.classList.remove('hidden');
  }, 700);
});

/* =====================================================================
   SCENE 11 — GIFT BOX
   ===================================================================== */

const giftBox = document.getElementById('giftBox');
const giftHint = document.getElementById('giftHint');
const giftNext = document.getElementById('giftNext');

giftBox.addEventListener('click', () => {
  if (giftBox.classList.contains('open')) return;
  giftBox.classList.add('open');
  giftHint.classList.add('hidden');
  celebrate();
  setTimeout(() => { giftNext.classList.remove('hidden'); }, 500);
});

/* =====================================================================
   SCENE 12 — FINAL SCREEN
   ===================================================================== */

const finalScene = document.querySelector('.scene[data-scene="final"]');
const finalObserver = new MutationObserver(() => {
  if (finalScene.classList.contains('active') && !scenesBuilt.final) {
    scenesBuilt.final = true;
    setTimeout(celebrate, 200);
    setInterval(() => {
      if (finalScene.classList.contains('active')) hearts();
    }, 4000);
  }
});
finalObserver.observe(finalScene, { attributes: true, attributeFilter: ['class'] });
