const { flushSoftAsserts } = require("../utils/assertions");
const { matchers } = require("jest-json-schema");
const path = require("path");
const fs = require("fs");

// Підняти сервер один раз для всіх тестів та коректно закрити після завершення
const app = require("../../app/server");
const server = app && app.server;

expect.extend(matchers);

jest.setTimeout(40000);

const SOFT_ASSERT_FILE = path.join(
  __dirname,
  "../../temp/.soft-assertions-temp.json",
);

global.errors = [];
global.softAssertResults = [];

beforeEach(() => {
  global.errors = [];
  global.softAssertResults = [];
});

afterEach(() => {
  const testName = expect.getState().currentTestName;
  if (global.softAssertResults.length > 0) {
    let allResults = {};
    if (fs.existsSync(SOFT_ASSERT_FILE)) {
      try {
        allResults = JSON.parse(fs.readFileSync(SOFT_ASSERT_FILE, "utf-8"));
      } catch {}
    }
    allResults[testName] = global.softAssertResults;
    fs.writeFileSync(SOFT_ASSERT_FILE, JSON.stringify(allResults));
  }
  flushSoftAsserts(global.errors);
});
afterAll((done) => {
  // Закриваємо лише підключення до БД, оскільки за сервер відповідає Jenkins
  if (db && typeof db.close === "function") {
    db.close((err) => {
      if (err) console.error("Error closing database:", err.message);
      done();
    });
  } else {
    done();
  }
});
