import { registerUser } from "./lib/demo-store.js";

async function main() {
  try {
    await registerUser({ email: "paul@example.com", password: "password123", founder: "Paul" });
    console.log("Registered Paul");
  } catch (e) {
    console.error("Paul error:", e.message);
  }

  try {
    await registerUser({ email: "sam@example.com", password: "password123", founder: "Sam" });
    console.log("Registered Sam");
  } catch (e) {
    console.error("Sam error:", e.message);
  }
}

main();
