// Janglar uchun matnlar SERVER tomonda saqlanadi — o'yinchilar o'z matnini
// tanlay olmaydi, shuning uchun aldamchilik (cheat) qilishning iloji yo'q.

export const RACE_TEXTS: string[] = [
  "The quick brown fox jumps over the lazy dog near the river bank and watches the sunset",
  "Practice makes perfect when you type with precision and grace every single day",
  "Speed without accuracy is just noise in the digital world of endless information",
  "Every master typist was once a beginner who never gave up on their dream",
  "The keyboard is your instrument play it with skill passion and rhythm",
  "In the world of typing consistency beats raw speed every time you sit down",
  "Focus on accuracy first and speed will follow naturally like a gentle stream",
  "Your fingers have memory trust them to find the right keys without looking",
  "A calm mind and steady hands are the secret of every great typist today",
  "Words flow like water when you stop thinking and let your hands take over",
  "Challenge yourself every day and watch your typing skills grow beyond limits",
  "The best racers do not rush they glide across the keys with perfect timing",
  "Typing is a superpower that opens the doors of the digital universe for you",
  "Stay relaxed breathe deeply and let every letter fall into its rightful place",
  "Great typists read ahead keeping their eyes on the words that come next",
  "Small daily practice beats rare intense sessions when you want real progress",
  "The race is long but the finish line belongs to those who type with heart",
  "Let your fingertips dance on the keyboard like a melody of pure speed",
  "Every keystroke counts so make each one accurate smooth and deliberate",
  "Victory in typing comes to those who balance courage with careful control",
];

export function getRandomRaceText(): string {
  return RACE_TEXTS[Math.floor(Math.random() * RACE_TEXTS.length)];
}
