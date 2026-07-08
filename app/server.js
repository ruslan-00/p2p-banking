const express = require("express");
const path = require("path");
const apiRoutes = require("./routes/api");
// Імпортуємо файл БД, щоб при старті сервера автоматично створилися таблиці та 20 юзерів
const db = require("./config/database");

const app = express();
const PORT = process.env.PORT || 3000;

// Мідлвар для обробки JSON у POST-запитах
app.use(express.json());

// Роздача статичних файлів фронтенду (HTML, CSS, JS) з папки public
app.use(express.static(path.join(__dirname, "public")));

// Підключення банківських API маршрутів
app.use("/api/v1", apiRoutes);

// Запуск сервера
const server = app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 Core Banking Ledger запущенно на порту ${PORT}`);
  console.log(`🔗 Відкрити банк убраузері: http://localhost:${PORT}`);
  console.log(`==================================================`);
});

// Експортуємо app для використання в тестах і збережемо посилання на сервер для закриття
module.exports = app;
module.exports.server = server; // дозволяє тестам коректно закривати сервер
