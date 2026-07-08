const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Шлях до файлу бази даних у колі проєкту
const dbPath = path.resolve(__dirname, "../../ledger.db");

// Підключення до реальної БД SQLite (якщо файлу немає, він створиться автоматично)
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Помилка підключення до бази даних:", err.message);
  } else {
    console.log("Успішно підключено до бази даних SQLite (ledger.db).");
  }
});

db.serialize(() => {
  // 1. Створення таблиці рахунків (accounts)
  db.run(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_number TEXT UNIQUE NOT NULL,
      client_name TEXT NOT NULL,
      balance REAL NOT NULL DEFAULT 0.0,
      currency TEXT NOT NULL CHECK(currency IN ('UAH', 'USD', 'EUR')),
      status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'FROZEN'))
    )
  `);

  // 2. Створення таблиці транзакцій/переказів (transfers)
  db.run(`
    CREATE TABLE IF NOT EXISTS transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_account TEXT NOT NULL,
      receiver_account TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT NOT NULL DEFAULT 'SUCCESS',
      FOREIGN KEY(sender_account) REFERENCES accounts(account_number),
      FOREIGN KEY(receiver_account) REFERENCES accounts(account_number)
    )
  `);

  // 3. Перевірка, чи база вже наповнена користувачами, щоб не дублювати їх
  db.get("SELECT COUNT(*) AS count FROM accounts", [], (err, row) => {
    if (err) {
      console.error("Помилка перевірки таблиці:", err.message);
      return;
    }

    if (row.count === 0) {
      console.log(
        "База даних порожня. Генеруємо 20 користувачів для FinTech Ledger...",
      );

      // Масив із 20 реалістичних банківських рахунків із різними бізнес-кейсами
      const users = [
        ["UA100001", "Руслан Коханський", 25500.0, "UAH", "ACTIVE"], // Головний тестовий акаунт
        ["UA100002", "Олена Петренко", 1200.5, "UAH", "ACTIVE"],
        ["US200003", "John Doe", 4500.0, "USD", "ACTIVE"], // Валютний рахунок
        ["EU300004", "Jan Müller", 890.0, "EUR", "ACTIVE"],
        ["UA100005", "Дмитро Ковальчук", 0.0, "UAH", "ACTIVE"], // Нульовий баланс (кейс для негативних тестів API)
        ["UA100006", "Марія Бондар", 150000.0, "UAH", "ACTIVE"], // VIP клієнт (великий баланс)
        ["UA100007", "Віталій Шевченко", 450.0, "UAH", "FROZEN"], // Заморожений рахунок (кейс на відмову в переказі)
        ["US200008", "Alice Smith", 50.0, "USD", "ACTIVE"],
        ["UA100009", "Тетяна Мороз", 3200.75, "UAH", "ACTIVE"],
        ["UA100010", "Олександр Ткаченко", 19.99, "UAH", "ACTIVE"], // Мінімальний баланс
        ["EU300011", "Marc Dubois", 2300.0, "EUR", "ACTIVE"],
        ["UA100012", "Ірина Кравченко", 8400.0, "UAH", "ACTIVE"],
        ["UA100013", "Сергій Лисенко", 12050.4, "UAH", "ACTIVE"],
        ["US200014", "Bob Johnson", 7100.25, "USD", "ACTIVE"],
        ["UA100015", "Наталія Мельник", 950.0, "UAH", "ACTIVE"],
        ["UA100016", "Андрій Поліщук", 55.0, "UAH", "ACTIVE"],
        ["UA100017", "Юлія Савченко", 14300.0, "UAH", "ACTIVE"],
        ["EU300018", "Anna Novak", 620.0, "EUR", "ACTIVE"],
        ["UA100019", "Максим Пасічник", 31000.0, "UAH", "ACTIVE"],
        ["UA100020", "Ольга Василенко", -50.0, "UAH", "ACTIVE"], // Технічний овердрафт (негативний баланс)
      ];

      const insertStmt = db.prepare(`
        INSERT INTO accounts (account_number, client_name, balance, currency, status)
        VALUES (?, ?, ?, ?, ?)
      `);

      users.forEach((user) => {
        insertStmt.run(user);
      });

      insertStmt.finalize((err) => {
        if (err) {
          console.error(
            "Помилка фіналізації запису користувачів:",
            err.message,
          );
        } else {
          console.log(
            "Успішно згенеровано та записано 20 користувачів до ledger.db!",
          );
        }
      });
    } else {
      console.log(
        `База даних уже містить ${row.count} користувачів. Пропускаємо генерацію.`,
      );
    }
  });
});

module.exports = db;
