# P2P Banking (Core Banking Ledger)

Короткий проєкт для демонстрації API та тестів для P2P-переказів.

Основні команди

```bash
npm install
npm test
npm start
```

Змінні оточення

Скопіюйте `.env.example` в `.env` і при потребі змініть `DB_PATH` або `PORT`.

API

- GET /api/v1/accounts — повертає список рахунків
- GET /api/v1/accounts/schema — повертає JSON-схему об'єкта рахунку
- POST /api/v1/transfer — тіло JSON: { sender_account, receiver_account, amount }

Зауваження

- Не комітьте файл `ledger.db` у git. Додайте його до `.gitignore` (якщо ще не додано).
- Для CI додайте workflow, який виконує `npm ci` та `npm test`.
