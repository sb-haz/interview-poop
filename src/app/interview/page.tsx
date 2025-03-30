// To implement word-by-word streaming, replace these sections in the original code file:

// 1. First, modify the interviewer question streaming (around line 107)
// Replace this character-by-character approach:
/*
// Type out question over 8 seconds
const typingDelay = 8000 / question.length
for (let i = 0; i <= question.length; i++) {
  if (!callActive) break
  const id = setTimeout(() => {
    setInterviewerTranscript(question.slice(0, i))
  }, i * typingDelay)
  timeoutIds.push(id)
}
*/

// With this word-by-word approach:
const words = question.split(' ')
const wordTypingDelay = 8000 / words.length // Distribute 8 seconds across all words
for (let i = 0; i <= words.length; i++) {
  if (!callActive) break
  const id = setTimeout(() => {
    setInterviewerTranscript(words.slice(0, i).join(' '))
  }, i * wordTypingDelay)
  timeoutIds.push(id)
}


// 2. Then modify the user response streaming (around line 170)
// Replace this character-by-character approach:
/*
for (let i = 0; i <= userResponse.length; i++) {
  const userId = setTimeout(() => {
    if (!callActive) return
    setUserTranscript(userResponse.slice(0, i))
  }, i * 20)
  timeoutIds.push(userId)
}
*/

// With this word-by-word approach:
const userWords = userResponse.split(' ')
const userWordDelay = userResponse.length * 20 / userWords.length // Maintain similar total duration
for (let i = 0; i <= userWords.length; i++) {
  const userId = setTimeout(() => {
    if (!callActive) return
    setUserTranscript(userWords.slice(0, i).join(' '))
  }, i * userWordDelay)
  timeoutIds.push(userId)
}