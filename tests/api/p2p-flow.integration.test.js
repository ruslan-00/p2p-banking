const axios = require("axios");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const { softExpect } = require("../utils/assertions");

// Шлях до файлу нашої реальної БД SQLite
const dbPath = path.resolve(__dirname, "../../ledger.db");

async function getResponse(payload) {
  try {
    const response = await axios.post(
      "http://localhost:3000/api/v1/transfer",
      payload,
    );
    return response;
  } catch (error) {
    return error.response;
  }
}

describe("Test Suite transfer API", () => {
  let db;

  // 1. Відкриваємо підключення до реальної бази даних перед запуском тестів
  beforeAll((done) => {
    db = new sqlite3.Database(dbPath, done);
  });

  test("happy flow with SQL DB validation", (done) => {
    const payload = {
      sender_account: "UA100001",
      receiver_account: "UA100002",
      amount: 30.0,
    };

    // Крок A: Примусово виставляємо початкові баланси в БД за допомогою SQL,
    // щоб тест ніколи не залежав від попередніх запусків.
    db.serialize(() => {
      db.run(
        "UPDATE accounts SET balance = 100.00 WHERE account_number = 'UA100001'",
      );
      db.run(
        "UPDATE accounts SET balance = 50.00 WHERE account_number = 'UA100002'",
        async () => {
          // Крок B: Виконуємо транзакцію через API
          const response = await getResponse(payload);

          // Крок C: Валідуємо відповідь API
          softExpect(
            () => expect(response.status).toBe(200),
            "Checking that the API returns 200 for a successful transfer",
          );
          softExpect(
            () => expect(response.data.status).toBe("SUCCESS"),
            "Checking that the API response status is SUCCESS",
          );

          // Крок D: Робимо прямий SELECT до бази, щоб перевірити реальне списання
          db.get(
            "SELECT balance FROM accounts WHERE account_number = 'UA100001'",
            (err, sender) => {
              softExpect(
                () => expect(sender.balance).toBe(70.0),
                "Checking that the sender's balance is correctly updated to 70.0 after transfer",
              );

              db.get(
                "SELECT balance FROM accounts WHERE account_number = 'UA100002'",
                (err, receiver) => {
                  softExpect(
                    () => expect(receiver.balance).toBe(80.0),
                    "Checking that the receiver's balance is correctly updated to 80.0 after transfer",
                  );

                  done(); // Повідомляємо Jest, що всі асинхронні перевірки завершено
                },
              );
            },
          );
        },
      );
    });
  });

  test("sender account is empty", async () => {
    const payload = {
      sender_account: "",
      receiver_account: "UA100002",
      amount: 10.0,
    };
    const response = await getResponse(payload);
    softExpect(
      () => expect(response.status).toBe(400),
      "Checking that the API returns 400 for missing sender account",
    );
    softExpect(
      () => expect(response.data.status).toBe("ERROR"),
      "Checking that the API response status is ERROR for missing sender account",
    );
    softExpect(
      () => expect(response.data.message).toContain("Missing required fields"),
      "Checking that the API response message indicates missing required fields for sender account",
    );
  });

  test("receiver account is empty", async () => {
    const payload = {
      sender_account: "UA100002",
      receiver_account: "",
      amount: 10.0,
    };
    const response = await getResponse(payload);
    softExpect(
      () => expect(response.status).toBe(400),
      "Checking that the API returns 400 for missing receiver account",
    );
    softExpect(
      () => expect(response.data.status).toBe("ERROR"),
      "Checking that the API response status is ERROR for missing receiver account",
    );
    softExpect(
      () => expect(response.data.message).toContain("Missing required fields"),
      "Checking that the API response message indicates missing required fields for receiver account",
    );
  });

  test("both accounts are empty", async () => {
    const payload = {
      sender_account: "",
      receiver_account: "",
      amount: 10.0,
    };
    const response = await getResponse(payload);
    softExpect(
      () => expect(response.status).toBe(400),
      "Checking that the API returns 400 for missing both accounts",
    );
    softExpect(
      () => expect(response.data.status).toBe("ERROR"),
      "Checking that the API response status is ERROR for missing both accounts",
    );
    softExpect(
      () => expect(response.data.message).toContain("Missing required fields"),
      "Checking that the API response message indicates missing required fields for both accounts",
    );
  });

  test("sender and receiver accounts are the same", async () => {
    const payload = {
      sender_account: "UA100001",
      receiver_account: "UA100001",
      amount: 10.0,
    };
    const response = await getResponse(payload);
    softExpect(
      () => expect(response.status).toBe(422),
      "Checking that the API returns 422 for same sender and receiver accounts",
    );
    softExpect(
      () => expect(response.data.status).toBe("ERROR"),
      "Checking that the API response status is ERROR for same sender and receiver accounts",
    );
    softExpect(
      () =>
        expect(response.data.message).toContain(
          "Sender and receiver accounts must be different",
        ),
      "Checking that the API response message indicates sender and receiver accounts must be different",
    );
  });

  test("amount is missing", async () => {
    const payload = {
      sender_account: "UA100001",
      receiver_account: "UA100002",
    };
    const response = await getResponse(payload);
    softExpect(
      () => expect(response.status).toBe(400),
      "Checking that the API returns 400 for missing amount",
    );
    softExpect(
      () => expect(response.data.status).toBe("ERROR"),
      "Checking that the API response status is ERROR for missing amount",
    );
    softExpect(
      () => expect(response.data.message).toContain("Missing required fields"),
      "Checking that the API response message indicates missing required fields for amount",
    );
  });
});
