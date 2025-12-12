
const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

export const playSound = (type: 'select' | 'correct' | 'wrong' | 'reveal' | 'buzz') => {
  // Ensure context is running (browsers suspend it until user interaction)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }

  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  const now = audioCtx.currentTime;

  switch (type) {
    case 'select':
      // Subtle click/pop
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(600, now);
      oscillator.frequency.exponentialRampToValueAtTime(300, now + 0.05);
      gainNode.gain.setValueAtTime(0.05, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      oscillator.start(now);
      oscillator.stop(now + 0.05);
      break;

    case 'correct':
      // Pleasant chime
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(523.25, now); // C5
      oscillator.frequency.setValueAtTime(659.25, now + 0.1); // E5
      
      gainNode.gain.setValueAtTime(0.05, now);
      gainNode.gain.linearRampToValueAtTime(0.05, now + 0.3);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1);
      
      oscillator.start(now);
      oscillator.stop(now + 1);
      
      // Harmonic
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1046.50, now); // C6
      gain2.gain.setValueAtTime(0.02, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc2.start(now);
      osc2.stop(now + 0.8);
      break;

    case 'wrong':
      // Soft buzzer
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(150, now);
      oscillator.frequency.linearRampToValueAtTime(120, now + 0.3);
      gainNode.gain.setValueAtTime(0.05, now);
      gainNode.gain.linearRampToValueAtTime(0.001, now + 0.3);
      
      // Low thud
      const osc3 = audioCtx.createOscillator();
      const gain3 = audioCtx.createGain();
      osc3.connect(gain3);
      gain3.connect(audioCtx.destination);
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(80, now);
      gain3.gain.setValueAtTime(0.08, now);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc3.start(now);
      osc3.stop(now + 0.3);
      
      oscillator.start(now);
      oscillator.stop(now + 0.3);
      break;
      
    case 'reveal':
      // Whoosh
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(200, now);
      oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.3);
      gainNode.gain.setValueAtTime(0.02, now);
      gainNode.gain.linearRampToValueAtTime(0.001, now + 0.3);
      oscillator.start(now);
      oscillator.stop(now + 0.3);
      break;

    case 'buzz':
      // Sharp distinct buzzer for lock-in
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(440, now);
      oscillator.frequency.linearRampToValueAtTime(350, now + 0.2);
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      oscillator.start(now);
      oscillator.stop(now + 0.5);
      break;
  }
};