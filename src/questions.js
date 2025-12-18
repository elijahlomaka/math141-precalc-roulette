// Placeholder deck: replace these with your real pre-calc questions later.
// Format:
// {
//   id: "q001",
//   prompt: "Question text...",
//   options: ["A", "B", "C", "D"],
//   answerIndex: 0, // 0-3
//   difficulty: 1, // optional
// }

export const QUESTIONS = Array.from({ length: 50 }, (_, i) => {
  const n = String(i + 1).padStart(3, "0");
  return {
    id: `q${n}`,
    prompt: `Placeholder pre-calc question #${i + 1}: what is ${i + 2} + ${i + 3}?`,
    options: [`${(i + 2) + (i + 3)}`, `${(i + 2) + (i + 4)}`, `${(i + 2) + (i + 5)}`, `${(i + 2) + (i + 6)}`],
    answerIndex: 0,
    difficulty: 1,
  };
});
