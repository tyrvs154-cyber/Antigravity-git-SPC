// Web Audio API Synthesizer for Hanamikke Cute SFX

class AudioSynth {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported in this browser:', e);
    }
  }

  resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  createOscillator(type, freq, duration) {
    if (!this.ctx) return null;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    return { osc, gain };
  }

  playClick() {
    this.resume();
    if (!this.ctx) return;
    
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    
    osc.type = 'sine';
    // Frequency drops rapidly from 600Hz to 150Hz (pop sound)
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
    
    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    
    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.08);
  }

  playScan() {
    this.resume();
    if (!this.ctx) return;
    
    const now = this.ctx.currentTime;
    const duration = 0.6;
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.linearRampToValueAtTime(800, now + duration * 0.5);
    osc.frequency.linearRampToValueAtTime(400, now + duration);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(220, now);
    osc2.frequency.linearRampToValueAtTime(880, now + duration * 0.5);
    osc2.frequency.linearRampToValueAtTime(440, now + duration);
    
    gainNode.gain.setValueAtTime(0.01, now);
    gainNode.gain.linearRampToValueAtTime(0.1, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    osc.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(this.ctx.destination);
    
    osc.start(now);
    osc2.start(now);
    osc.stop(now + duration);
    osc2.stop(now + duration);
  }

  playSuccess() {
    this.resume();
    if (!this.ctx) return;
    
    const now = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    const noteDuration = 0.09;
    
    notes.forEach((freq, index) => {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * noteDuration);
      
      const noteStart = now + index * noteDuration;
      const noteEnd = noteStart + 0.25;
      
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.setValueAtTime(0.15, noteStart);
      gainNode.gain.exponentialRampToValueAtTime(0.01, noteEnd);
      
      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);
      
      osc.start(noteStart);
      osc.stop(noteEnd);
    });
  }

  playLevelUp() {
    this.resume();
    if (!this.ctx) return;
    
    const now = this.ctx.currentTime;
    
    // Play a happy 8-bit fanfare arpeggio, then a sustained chord
    const arpeggio = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const step = 0.12;
    
    arpeggio.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * step);
      
      const start = now + idx * step;
      const end = start + 0.4;
      
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.setValueAtTime(0.12, start);
      gainNode.gain.exponentialRampToValueAtTime(0.01, end);
      
      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);
      
      osc.start(start);
      osc.stop(end);
    });

    // Sustained high chord
    setTimeout(() => {
      const chord = [523.25 * 1.5, 659.25 * 1.5, 783.99 * 1.5]; // G5, B5, D6 approximate
      const chordStart = now + 4 * step;
      const chordDuration = 0.6;
      
      chord.forEach(freq => {
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, chordStart);
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.setValueAtTime(0.08, chordStart);
        gainNode.gain.exponentialRampToValueAtTime(0.01, chordStart + chordDuration);
        
        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        
        osc.start(chordStart);
        osc.stop(chordStart + chordDuration);
      });
    }, 0);
  }
}

export const audio = new AudioSynth();
export default audio;
