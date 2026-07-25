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
/rinibot-passwordmaker - Generate a random password
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
app.command("/rinibot-emoticons", async ({ ack, respond }) => {
  await ack();

  const emoticons = [
    "(⁠•⁠̀⁠ᴗ⁠•⁠́⁠)⁠و", "(≧∇≦)", "(╯°□°)╯︵ ┻━┻", "(=^･ω･^=)", "(◕‿◕✿)", "(ᵔᴥᵔ)", "(¬‿¬)"
  ];

  await respond({
    text:
`Pick one of these cool emoticons:
1. ${emoticons[0]}
2. ${emoticons[1]}
3. ${emoticons[2]}
4. ${emoticons[3]}
5. ${emoticons[4]}
6. ${emoticons[5]}
7. ${emoticons[6]}`
  });
});