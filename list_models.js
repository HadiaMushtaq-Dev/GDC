const { GoogleGenerativeAI } = require("@google/generative-ai");

async function main() {
  const genAI = new GoogleGenerativeAI("AIzaSyC-hByPdzp90gvvxyuriCO2aHgo_5JL8Es");
  
  try {
    const fetch = global.fetch;
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyC-hByPdzp90gvvxyuriCO2aHgo_5JL8Es");
    const json = await res.json();
    console.log(JSON.stringify(json, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
