let ctx = null;
let enabled = true;

function getCtx() {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    ctx = new AudioCtx();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

export function setSoundEnabled(value) {
  enabled = value;
}

export function isSoundEnabled() {
  return enabled;
}

function clickNoise(duration, freq, gainValue) {
  const audio = getCtx();
  const bufferSize = Math.floor(audio.sampleRate * duration);
  const buffer = audio.createBuffer(1, bufferSize, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
  }
  const noise = audio.createBufferSource();
  noise.buffer = buffer;

  const bandpass = audio.createBiquadFilter();
  bandpass.type = "bandpass";
  bandpass.frequency.value = freq;
  bandpass.Q.value = 1.2;

  const gain = audio.createGain();
  gain.gain.value = gainValue;

  noise.connect(bandpass).connect(gain).connect(audio.destination);
  noise.start();
  noise.stop(audio.currentTime + duration);
}

export function playKeyClack() {
  if (!enabled) return;
  try {
    clickNoise(0.045, 1800 + Math.random() * 800, 0.35);
  } catch (e) {
    /* audio unavailable, ignore */
  }
}

export function playErrorThud() {
  if (!enabled) return;
  try {
    clickNoise(0.06, 350, 0.4);
  } catch (e) {
    /* audio unavailable, ignore */
  }
}

export function playBell() {
  if (!enabled) return;
  try {
    const audio = getCtx();
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "sine";
    osc.frequency.value = 1600;
    gain.gain.setValueAtTime(0.25, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.8);
    osc.connect(gain).connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + 0.8);
  } catch (e) {
    /* audio unavailable, ignore */
  }
}

export function playFanfare() {
  if (!enabled) return;
  try {
    const audio = getCtx();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      const startAt = audio.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0.001, startAt);
      gain.gain.linearRampToValueAtTime(0.22, startAt + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.35);
      osc.connect(gain).connect(audio.destination);
      osc.start(startAt);
      osc.stop(startAt + 0.4);
    });
  } catch (e) {
    /* audio unavailable, ignore */
  }
}

export function playStampThud() {
  if (!enabled) return;
  try {
    clickNoise(0.09, 220, 0.5);
  } catch (e) {
    /* audio unavailable, ignore */
  }
}
