
const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

// --- BACKGROUND MUSIC MANAGER ---
// Music is now handled via YouTube Iframe in App.tsx
let isMusicEnabled = false;

export const setMusicState = (play: boolean) => {
  isMusicEnabled = play;
  // No-op: Music logic moved to React component for YouTube embedding
};

export const getMusicState = () => isMusicEnabled;

// --- SFX MANAGER ---
export const playSound = (type: 'select' | 'correct' | 'wrong' | 'reveal' | 'buzz' | 'tick' | 'alarm' | 'mobile_buzz' | 'join') => {
  // Ensure context is running (browsers suspend it until user interaction)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }

  const now = audioCtx.currentTime;
  const masterGain = audioCtx.createGain();
  masterGain.connect(audioCtx.destination);
  masterGain.gain.value = 1.0;

  switch (type) {
    case 'select':
      // Clear glass tap
      const selOsc = audioCtx.createOscillator();
      const selGain = audioCtx.createGain();
      selOsc.connect(selGain);
      selGain.connect(masterGain);
      selOsc.type = 'sine';
      selOsc.frequency.setValueAtTime(800, now);
      selOsc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
      selGain.gain.setValueAtTime(0.1, now);
      selGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      selOsc.start(now);
      selOsc.stop(now + 0.1);
      break;

    case 'tick':
      // Mechanical wooden tick
      const tickOsc = audioCtx.createOscillator();
      const tickGain = audioCtx.createGain();
      const tickFilter = audioCtx.createBiquadFilter();
      
      tickOsc.connect(tickFilter);
      tickFilter.connect(tickGain);
      tickGain.connect(masterGain);

      tickOsc.type = 'square';
      tickFilter.type = 'bandpass';
      tickFilter.frequency.value = 1200;
      
      tickOsc.frequency.setValueAtTime(200, now);
      tickGain.gain.setValueAtTime(0.15, now);
      tickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      
      tickOsc.start(now);
      tickOsc.stop(now + 0.05);
      break;

    case 'alarm':
      // Double Buzzer (Time Up)
      const createBuzz = (startTime: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(masterGain);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, startTime);
        osc.frequency.linearRampToValueAtTime(100, startTime + 0.4);
        gain.gain.setValueAtTime(0.3, startTime);
        gain.gain.linearRampToValueAtTime(0.001, startTime + 0.4);
        osc.start(startTime);
        osc.stop(startTime + 0.4);
      };
      createBuzz(now);
      createBuzz(now + 0.2);
      break;

    case 'correct':
      // Bright major chord arpeggio
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(masterGain);
        osc.type = 'triangle';
        osc.frequency.value = freq;
        const start = now + (i * 0.05);
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.1, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.6);
        osc.start(start);
        osc.stop(start + 0.6);
      });
      break;

    case 'wrong':
      // Discordant fail sound
      [150, 142].forEach((freq) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(masterGain);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.linearRampToValueAtTime(freq - 20, now + 0.4);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      });
      break;
      
    case 'reveal':
      // Digital whoosh
      const revOsc = audioCtx.createOscillator();
      const revGain = audioCtx.createGain();
      revOsc.connect(revGain);
      revGain.connect(masterGain);
      revOsc.type = 'sine';
      revOsc.frequency.setValueAtTime(220, now);
      revOsc.frequency.exponentialRampToValueAtTime(880, now + 0.4);
      revGain.gain.setValueAtTime(0.05, now);
      revGain.gain.linearRampToValueAtTime(0, now + 0.4);
      revOsc.start(now);
      revOsc.stop(now + 0.4);
      break;

    case 'buzz':
      // Host: Sharp distinct lock-in sound
      const buzzOsc = audioCtx.createOscillator();
      const buzzGain = audioCtx.createGain();
      buzzOsc.connect(buzzGain);
      buzzGain.connect(masterGain);
      buzzOsc.type = 'square';
      buzzOsc.frequency.setValueAtTime(440, now);
      buzzOsc.frequency.linearRampToValueAtTime(350, now + 0.2);
      buzzGain.gain.setValueAtTime(0.2, now);
      buzzGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      buzzOsc.start(now);
      buzzOsc.stop(now + 0.5);
      break;

    case 'mobile_buzz':
      // Player: High pitched confirmation feedback
      const mobOsc = audioCtx.createOscillator();
      const mobGain = audioCtx.createGain();
      mobOsc.connect(mobGain);
      mobGain.connect(masterGain);
      mobOsc.type = 'sine';
      mobOsc.frequency.setValueAtTime(880, now);
      mobOsc.frequency.exponentialRampToValueAtTime(1760, now + 0.1);
      mobGain.gain.setValueAtTime(0.2, now);
      mobGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      mobOsc.start(now);
      mobOsc.stop(now + 0.15);
      break;
      
    case 'join':
      // Friendly bubble pop
      const joinOsc = audioCtx.createOscillator();
      const joinGain = audioCtx.createGain();
      joinOsc.connect(joinGain);
      joinGain.connect(masterGain);
      joinOsc.type = 'sine';
      joinOsc.frequency.setValueAtTime(400, now);
      joinOsc.frequency.linearRampToValueAtTime(600, now + 0.1);
      joinGain.gain.setValueAtTime(0, now);
      joinGain.gain.linearRampToValueAtTime(0.1, now + 0.02);
      joinGain.gain.linearRampToValueAtTime(0, now + 0.1);
      joinOsc.start(now);
      joinOsc.stop(now + 0.1);
      break;
  }
};
