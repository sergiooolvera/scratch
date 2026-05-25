export function playSound(sound: 'magic' | 'airhorn') {
  if (typeof window === 'undefined') return;
  
  // Check if sounds are muted globally
  const isMuted = localStorage.getItem('soundMuted') === 'true';
  if (isMuted) return;

  try {
    const ext = sound === 'airhorn' ? 'mp3' : 'wav';
    const audio = new Audio(`/sounds/${sound}.${ext}`);
    
    // Set a very comfortable volume so it doesn't scare users
    audio.volume = sound === 'airhorn' ? 0.25 : 0.35;
    
    audio.play().catch(err => {
      // Browser autoplay policies can block audio if user hasn't interacted yet
      console.warn('Audio playback blocked or failed:', err.message);
    });
  } catch (err) {
    console.error('Error playing sound:', err);
  }
}
