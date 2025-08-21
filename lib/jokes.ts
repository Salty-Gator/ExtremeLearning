// Simple local jokes module acting as a small rules engine for dad jokes

const RAW_DAD_JOKES: string[] = [
  "Why don’t skeletons fight each other?; They don’t have the guts.;",
  "I used to play piano by ear; Now I use my hands.;",
  "Why did the scarecrow win an award?; Because he was outstanding in his field.;",
  "I’m reading a book about anti-gravity; It’s impossible to put down.;",
  "Why did the math book look sad?; Because it had too many problems.;",
  "What do you call fake spaghetti?; An impasta.;",
  "Why did the bicycle fall over?; It was two-tired.;",
  "I ordered a chicken and an egg from Amazon; I’ll let you know.;",
  "What did the grape do when it got stepped on?;  Nothing, it just let out a little wine.;", 
"How does the ocean say hi?;  It waves.;", 
"Why can’t you trust stairs?;  They’re always up to something.;", 
"Why don’t eggs tell jokes?;  They’d crack each other up.;", 
"What do you call cheese that isn’t yours?;  Nacho cheese.;", 
"What did one wall say to the other wall?;  I’ll meet you at the corner.;", 
"Why did the scarecrow win an award?;  He was outstanding in his field.;", 
"Why don’t seagulls fly over the bay?;  Because then they’d be bagels.;", 
"How do you organize a space party?;  You planet.;", 
"Why was the math book sad?;  It had too many problems.;", 
"What kind of shoes do ninjas wear?;  Sneakers.;", 
"Why was the computer cold?;  It left its Windows open.;", 
"What do you call a fish without eyes?;  Fsh.;", 
"Why did the golfer bring two pairs of pants?;  In case he got a hole in one.;", 
"What do you call an alligator in a vest?;  An investigator.;", 
"Why do cows have hooves instead of feet?;  Because they lactose.;", 
"Why don’t oysters give to charity?;  Because they’re shellfish.;", 
"Why did the photo go to jail?;  Because it was framed.;", 
"How do you make a tissue dance?;  You put a little boogie in it.;", 
"Why can’t your nose be 12 inches long?;  Because then it would be a foot.;", 
"Why did the cookie go to the doctor?;  It was feeling crumbly.;", 
"What did the janitor say when he jumped out of the closet?;  Supplies!;", 
"Why don’t you ever see elephants hiding in trees?;  Because they’re so good at it.;", 
"Why did the coffee file a police report?;  It got mugged.;", 
"What do you call a pile of cats?;  A meow-tain.;", 
"Why did the tomato blush?;  Because it saw the salad dressing.;", 
"Why did the bicycle fall over?;  Because it was exhausted.;", 
"What kind of tree fits in your hand?;  A palm tree.;", 
"What do you call a can opener that doesn’t work?;  A can’t opener.;", 
"Why do bees have sticky hair?;  Because they use honeycombs.;", 
"What’s brown and sticky?;  A stick.;", 
"Why did the music teacher go to the principal’s office?;  She found herself in treble.;", 
"How do cows stay up to date with current events?;  They read the moos-paper.;", 
"Why don’t some couples go to the gym?;  Because some relationships don’t work out.;", 
"How do you catch a squirrel?;  Climb a tree and act like a nut.;", 
"What do you call two birds in love?;  Tweet-hearts.;", 
"Why was the belt arrested?;  For holding up a pair of pants.;", 
"Why can’t you give Elsa a balloon?;  Because she’ll let it go.;", 
"Why was the stadium so hot?;  Because all the fans left.;", 
"Why do fish live in salt water?;  Because pepper makes them sneeze.;", 
"What did the fisherman say to the magician?;  Pick a cod, any cod.;", 
"Why did the banana go to the doctor?;  Because it wasn’t peeling well.;", 
"How do you make holy water?;  You boil the hell out of it.;", 
"What’s orange and sounds like a parrot?;  A carrot.;", 
"Why did the man run around his bed?;  Because he was trying to catch up on his sleep.;", 
"What happens if you eat yeast?;  You’ll rise to the occasion.;", 
"Why did the computer go to the dentist?;  It had Bluetooth.;", 
];

function normalizeJoke(raw: string): string {
  const parts = raw
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  const q = parts[0] ? (parts[0].endsWith("?") ? parts[0] : parts[0] + "?") : "";
  const a = parts[1] ? (parts[1].endsWith(".") ? parts[1] : parts[1] + ".") : "";
  return q && a ? `${q} ${a}` : raw.trim();
}

export function getRandomDadJoke(): string {
  if (RAW_DAD_JOKES.length === 0) return "Why did the developer cross the road? To ship features.";
  const raw = RAW_DAD_JOKES[Math.floor(Math.random() * RAW_DAD_JOKES.length)];
  return normalizeJoke(raw);
}

export const dadJokes = RAW_DAD_JOKES;


