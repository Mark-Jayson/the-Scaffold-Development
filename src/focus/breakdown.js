// "Break it down": turns a task into a few small, concrete steps so starting is easy.
// Each recipe opens with the smallest possible action.
const RECIPES = [
  [/\b(write|draft|notes|report|essay|copy|blog|release notes|retro)\b/i, ['Open a blank doc and give it a title', 'Jot 3 messy bullet points', 'Turn the first bullet into a sentence', 'Fill in the rest', 'Read it once, then save or send']],
  [/\b(email|reply|message|invoice|send|text)\b/i, ['Open your inbox or the thread', 'Write just the first line', 'Add the key details', 'Read it once and hit send']],
  [/\b(call|phone|ring)\b/i, ['Find the number', 'Write 2 bullets on what to say', 'Make the call', 'Note any follow-ups']],
  [/\b(clean|tidy|laundry|dishes|declutter|vacuum)\b/i, ['Start a 10-minute timer', 'Pick up 5 things', 'Clear one surface', 'Put things back where they live']],
  [/\b(groceries|shopping|shop|buy|pick up|order)\b/i, ['Check what you already have', 'Write the list', 'Grab keys, bags and wallet', 'Go and get it']],
  [/\b(review|check|feedback|proofread)\b/i, ['Open the thing to review', 'Skim it once without notes', 'Write your top 3 comments', 'Share your notes']],
  [/\b(prepare|prep|deck|presentation|slides|demo|pitch)\b/i, ['Open the deck or a blank file', 'Outline the story in 5 bullets', 'Make the first slide', 'Fill in the rest', 'Do one run-through']],
  [/\b(read|study|pages|chapter|course|learn)\b/i, ['Get the book and a comfy spot', 'Read just 2 pages', 'Keep going until the timer ends', 'Write one line about what stuck']],
  [/\b(gym|run|workout|yoga|walk|stretch|swim|exercise)\b/i, ['Put your shoes on', 'Fill your water bottle', 'Warm up for 2 minutes', 'Do the main session', 'Stretch for a minute']],
  [/\b(book|schedule|appointment|dentist|doctor|haircut|reserve)\b/i, ['Find the website or number', 'Check your free slots', 'Book it', 'Add it to your plan']],
  [/\b(pay|bill|rent|bank|tax)\b/i, ['Open your banking app', 'Find the bill details', 'Pay it', 'Save the confirmation']],
  [/\b(plan|organize|organise|sort)\b/i, ['List everything on your mind', 'Circle the 3 that matter most', 'Give each a time or day', 'Let the rest wait']],
  [/\b(water|plants|feed|walk the dog)\b/i, ['Fill the watering can', 'Do the first one', 'Finish the rest']],
];
const DEFAULT = ['Get what you need in front of you', 'Do the first 2 minutes', 'Keep going until a natural stopping point', 'Wrap up and tick it off'];

let counter = 0;
export function breakDown(title) {
  const steps = RECIPES.find(([pattern]) => pattern.test(title))?.[1] ?? DEFAULT;
  return steps.map(text => ({ id: `step-${Date.now().toString(36)}-${(counter += 1)}`, text, done: false }));
}

const HIGH = /\b(write|draft|prepare|deck|presentation|design|review|ship|interview|gym|run|workout|report|deploy|plan|study)\b/i;
const LOW = /\b(water|plants|pay|bill|reply|text|call mom|read|tidy|pick up|groceries|walk|stretch|book)\b/i;
export const energyOf = title => (HIGH.test(title) ? 'high' : LOW.test(title) ? 'low' : 'medium');
