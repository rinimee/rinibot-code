const axios = require("axios");
require("dotenv").config();

const { App } = require("@slack/bolt");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true
});

function normalizeName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getDailyCharacter(characters) {
  const today = new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (const char of today) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return characters[hash % characters.length];
}

async function fetchCharacterDetails(slug) {
  const response = await axios.get(`https://api.genshin.dev/characters/${slug}`);
  return response.data || {};
}

function getCharacterHint(details) {
  const element = details.vision || details.element || "Unknown element";
  const weapon = details.weaponType || details.weapon || details.weapon_type || "Unknown weapon";
  return { element, weapon };
}

function displayName(slug) {
  return slug
    .replace(/-/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}


app.command("/rinibot-ping", async ({ command, ack, respond }) => {
  const start = Date.now();
  await ack();
  const latency = Date.now() - start;
  await respond({ text: `Pong!\nLatency: ${latency}ms` });
});

(async () => {
  await app.start();
  console.log("bot is running!");
})();
app.command("/rinibot-help", async ({ ack, respond }) => {
  await ack();
  await respond({
    text:
`Available Commands:
/rinibot-ping - Check bot latency
/rinibot-catfact - Get a cat fact
/rinibot-favcatfact - Favorite cat plus a cat fact
/rinibot-joke - Get a random joke
/rinibot-quote - Get a random quote
/rinibot-passwordmaker - Generate a random password
/rinibot-randomgenshin - Get a random genshin character
/rinibot-arttips - Get a random art tip
/rinibot-emoticons - Get a list of cool emoticons`
  });
});
app.command("/rinibot-catfact", async ({ ack, respond }) => {
  await ack();

  try {
    const response = await axios.get("https://catfact.ninja/fact");
    await respond({ text: `Cat Fact:\n${response.data.fact}` });
  } catch (err) {
    await respond({ text: "Failed to fetch a cat fact." });
  }
});
app.command("/rinibot-joke", async ({ ack, respond }) => {
  await ack();

  try {
    const response = await axios.get("https://official-joke-api.appspot.com/random_joke");
    await respond({
      text:
`${response.data.setup}

${response.data.punchline}`
    });
  } catch (err) {
    await respond({ text: "Failed to fetch a joke." });
  }
});
app.command("/rinibot-quote", async ({ ack, respond }) => {
  await ack();
  try {
    const response = await axios.get("https://api.quotable.io/random");
    await respond({
      text:
`${response.data.content}

— ${response.data.author}`
    });
  } catch (err) {
    await respond({ text: "Failed to fetch a quote." });
  }
});
app.command("/rinibot-passwordmaker", async ({ ack, respond }) => {
  await ack();
  try{
    const response = await axios.get("https://passwordwolf.com/api/?length=12&special=1");
    await respond({
      text:
`Here is your generated password: ${response.data[0].password}`
    });
  } catch (err) {
    await respond({ text: "Failed to generate a password." });
  }
});
app.command("/rinibot-randomgenshin", async ({ ack, respond }) => {
  await ack();
  try{
    const response = await axios.get("https://genshin-impact.fandom.com/wiki/Character/List");
    const characters = Array.isArray(response.data) ? response.data : Object.keys(response.data);
    const randomCharacter = characters[Math.floor(Math.random() * characters.length)];
    await respond({
      text:
`Here is a random Genshin Impact character: ${displayName(randomCharacter)}`
    });
  } catch (err) {
    await respond({ text: "Failed to fetch a Genshin Impact character." });
  }
});

app.command("/rinibot-genshinde", async ({ command, ack, respond }) => {
  await ack();
  const text = (command.text || "").trim();
  const [action, ...rest] = text.split(/\s+/);
  const guess = rest.join(" ");

  if (!action || !["start", "guess"].includes(action.toLowerCase())) {
    await respond({
      text:
`Usage:
/rinibot-genshinde start
/rinibot-genshinde guess <character name>`
    });
    return;
  }

  try {
    const response = await axios.get("https://api.genshin.dev/characters");
    const characters = Array.isArray(response.data) ? response.data : Object.keys(response.data);
    const daily = getDailyCharacter(characters);
    const displayDaily = displayName(daily);
    const details = await fetchCharacterDetails(daily);
    const hint = getCharacterHint(details);
    const letterCount = displayDaily.replace(/ /g, "").length;

    if (action.toLowerCase() === "start") {
      await respond({
        text:
`Genshindle Daily Guess:
The daily character has ${letterCount} letters and starts with ${displayDaily.charAt(0)}.
Hint: element is ${hint.element}, weapon is ${hint.weapon}.
Use /rinibot-genshinde guess <character name> to answer.`
      });
      return;
    }

    if (!guess) {
      await respond({ text: "Please provide a character name after guess." });
      return;
    }

    if (normalizeName(guess) === normalizeName(displayDaily)) {
      await respond({ text: `Correct! Today’s Genshindle character is ${displayDaily}.` });
    } else {
      await respond({
        text:
`Not quite. Try again!
Hint: element is ${hint.element}, weapon is ${hint.weapon}.
The character starts with ${displayDaily.charAt(0)} and has ${letterCount} letters.`
      });
    }
  } catch (err) {
    await respond({ text: "Failed to fetch today’s Genshin character. Please try again later." });
  }
});
app.command("/rinibot-favcatfact", async ({ command, ack, respond }) => {
  await ack();
  const favoriteCat = (command.text || "").trim();

  if (!favoriteCat) {
    await respond({
      text: "Please tell me your favorite cat using /rinibot-favcatfact <cat name or breed>."
    });
    return;
  }

  try {
    const response = await axios.get("https://catfact.ninja/fact");
    await respond({
      text: `Your favorite cat is ${favoriteCat}.
Here is a cat fact based on that answer:
${response.data.fact}`
    });
  } catch (err) {
    await respond({ text: "Failed to fetch a cat fact. Please try again later." });
  }
});
app.command("/rinibot-arttips", async ({ ack, respond }) => {
  await ack();

  const artTips = [
    "Start with simple shapes and build from there.",
    "Use references to improve proportions and lighting.",
    "Vary line weight to create depth and emphasis.",
    "Block in large color areas before adding details.",
    "Keep a consistent light source across the whole scene.",
    "Try painting with limited colors to improve harmony.",
    "Practice gesture drawing to make poses feel natural.",
    "Let your shadows be slightly cooler than your light.",
    "Use texture sparingly to make focal points stand out.",
    "Study master artworks and see how they handle composition."
  ];

  const tip = artTips[Math.floor(Math.random() * artTips.length)];

  try {
    await respond({ text: `Art Tip:\n${tip}` });
  } catch (err) {
    await respond({ text: "Failed to send an art tip. Please try again." });
  }
});
app.command("/rinibot-emoticons", async ({ command, ack, respond }) => {
  await ack();

  const emoticons = [
    "(⁠•⁠̀⁠ᴗ⁠•⁠́⁠)⁠و", "(≧∇≦)", "(╯°□°)╯︵ ┻━┻", "(=^･ω･^=)", "(◕‿◕✿)", "(ᵔᴥᵔ)", "(¬‿¬)"
  ];
  const choice = (command.text || "").trim();
  const selectedIndex = parseInt(choice, 10) - 1;

  if (choice && selectedIndex >= 0 && selectedIndex < emoticons.length) {
    await respond({ text: `You chose emoticon ${choice}: ${emoticons[selectedIndex]}` });
    return;
  }

  await respond({
    text:
`Choose a cool emoticon by number:
1. ${emoticons[0]}
2. ${emoticons[1]}
3. ${emoticons[2]}
4. ${emoticons[3]}
5. ${emoticons[4]}
6. ${emoticons[5]}
7. ${emoticons[6]}

Use /rinibot-emoticons <number> to pick one.`
  });
});