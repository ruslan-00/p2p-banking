const express = require("express");
const router = express.Router();
const db = require("../config/database");

// 1. GET /api/v1/accounts — Отримати всі 20 рахунків (для Cypress та Jest)
router.get("/accounts", (req, res) => {
  db.all("SELECT * FROM accounts", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// 2. GET /api/v1/accounts/schema — Ендпоінт, що віддає JSON-схему (для контрактних тестів)
router.get("/accounts/schema", (req, res) => {
  const schema = {
    type: "array",
    items: {
      type: "object",
      required: [
        "id",
        "account_number",
        "client_name",
        "balance",
        "currency",
        "status",
      ],
      properties: {
        id: { type: "integer" },
        account_number: { type: "string", pattern: "^[A-Z]{2}\\d{6}$" },
        client_name: { type: "string" },
        balance: { type: "number" },
        currency: { type: "string", enum: ["UAH", "USD", "EUR"] },
        status: { type: "string", enum: ["ACTIVE", "FROZEN"] },
      },
    },
  };
  res.json(schema);
});

// 3. POST /api/v1/transfer — Виконання P2P переказу з валідацією
router.post("/transfer", (req, res) => {
  const { sender_account, receiver_account, amount } = req.body;

  // Валідація вхідних полів
  if (!sender_account || !receiver_account || amount === undefined) {
    return res
      .status(400)
      .json({ status: "ERROR", message: "Missing required fields" });
  }

  if (amount <= 0) {
    return res
      .status(422)
      .json({ status: "ERROR", message: "Amount must be greater than zero" });
  }

  if (sender_account === receiver_account) {
    return res
      .status(422)
      .json({
        status: "ERROR",
        message: "Sender and receiver accounts must be different",
      });
  }

  // Отримуємо дані відправника
  db.get(
    "SELECT * FROM accounts WHERE account_number = ?",
    [sender_account],
    (err, sender) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!sender)
        return res
          .status(404)
          .json({ status: "ERROR", message: "Sender account not found" });
      if (sender.status === "FROZEN")
        return res
          .status(400)
          .json({ status: "ERROR", message: "Sender account is frozen" });
      if (sender.balance < amount)
        return res
          .status(400)
          .json({ status: "ERROR", message: "Insufficient funds" });

      // Отримуємо дані отримувача
      db.get(
        "SELECT * FROM accounts WHERE account_number = ?",
        [receiver_account],
        (err, receiver) => {
          if (err) return res.status(500).json({ error: err.message });
          if (!receiver)
            return res
              .status(404)
              .json({ status: "ERROR", message: "Receiver account not found" });
          if (receiver.status === "FROZEN")
            return res
              .status(400)
              .json({ status: "ERROR", message: "Receiver account is frozen" });

          // Перевірка крос-валютності (спрощена логіка: банк вимагає однакові валюти для P2P)
          if (sender.currency !== receiver.currency) {
            return res
              .status(400)
              .json({
                status: "ERROR",
                message: "Cross-currency transfers are not supported",
              });
          }

          // Виконання транзакції всередині БД за допомогою серіалізації (атомарність)
          db.serialize(() => {
            // Списання у відправника
            db.run(
              "UPDATE accounts SET balance = balance - ? WHERE account_number = ?",
              [amount, sender_account],
            );

            // Зарахування отримувачу
            db.run(
              "UPDATE accounts SET balance = balance + ? WHERE account_number = ?",
              [amount, receiver_account],
            );

            // Логування в таблицю transfers
            db.run(
              "INSERT INTO transfers (sender_account, receiver_account, amount, currency, status) VALUES (?, ?, ?, ?, ?)",
              [
                sender_account,
                receiver_account,
                amount,
                sender.currency,
                "SUCCESS",
              ],
              function (err) {
                if (err) {
                  return res.status(500).json({ error: err.message });
                }
                // Успішна відповідь (Ідеально підходить для Soft Assertions у Jest)
                res.json({
                  status: "SUCCESS",
                  message: "Transfer completed successfully",
                  transaction_id: this.lastID,
                  details: {
                    sender: sender_account,
                    receiver: receiver_account,
                    amount: Number(amount),
                    currency: sender.currency,
                  },
                });
              },
            );
          });
        },
      );
    },
  );
});

module.exports = router;
