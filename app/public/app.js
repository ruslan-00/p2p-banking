// 1. Функція завантаження та рендерингу таблиці рахунків (для index.html)
async function loadAccountsTable() {
  const tableBody = document.getElementById("accounts-table-body");
  if (!tableBody) return;

  try {
    const response = await fetch("/api/v1/accounts");
    const accounts = await response.json();

    tableBody.innerHTML = ""; // Очищення перед рендером

    accounts.forEach((account) => {
      // Спеціальні CSS стилі для заблокованих (FROZEN) рахунків
      const statusClass =
        account.status === "ACTIVE"
          ? "bg-green-100 text-green-800"
          : "bg-red-100 text-red-800";

      const rowHtml = `
        <tr class="hover:bg-gray-50 border-b" data-cy="account-row">
          <td class="py-4 px-6 text-sm text-gray-400 font-mono">${account.id}</td>
          <td class="py-4 px-6 font-semibold font-mono text-gray-900" data-cy="account-number-cell">${account.account_number}</td>
          <td class="py-4 px-6 font-medium">${account.client_name}</td>
          <td class="py-4 px-6 text-right font-bold text-gray-900" data-cy="account-balance-cell">${account.balance.toFixed(2)}</td>
          <td class="py-4 px-6 font-semibold text-gray-500 font-mono">${account.currency}</td>
          <td class="py-4 px-6 text-center">
            <span class="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}" data-cy="account-status-badge">
              ${account.status}
            </span>
          </td>
        </tr>
      `;
      tableBody.insertAdjacentHTML("beforeend", rowHtml);
    });
  } catch (error) {
    console.error("Не вдалося завантажити дані рахунків:", error);
  }
}

// 2. Обробка надсилання форми P2P переказу (для transfer.html)
async function handleTransferSubmit(event) {
  event.preventDefault();

  const sender_account = document.getElementById("sender-input").value.trim();
  const receiver_account = document
    .getElementById("receiver-input")
    .value.trim();
  const amount = parseFloat(document.getElementById("amount-input").value);

  const alertBox = document.getElementById("alert-box");
  const submitBtn = document.getElementById("submit-btn");

  // Зміна стану кнопки під час обробки
  submitBtn.disabled = true;
  submitBtn.innerText = "Оброка транзакції...";

  try {
    const response = await fetch("/api/v1/transfer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sender_account, receiver_account, amount }),
    });

    const result = await response.json();

    alertBox.classList.remove(
      "hidden",
      "bg-green-100",
      "text-green-800",
      "bg-red-100",
      "text-red-800",
    );

    if (response.ok && result.status === "SUCCESS") {
      // Показуємо успіх (Cypress перевірятиме наявність цього повідомлення)
      alertBox.classList.add("bg-green-100", "text-green-800");
      alertBox.setAttribute('data-cy="transfer-success-alert"', "");
      alertBox.innerText = `🎉 ${result.message}! ID транзакції: #${result.transaction_id}`;
      document.getElementById("transfer-form").reset();
    } else {
      // Показуємо помилку від сервера (для негативних сценаріїв)
      alertBox.classList.add("bg-red-100", "text-red-800");
      alertBox.setAttribute('data-cy="transfer-error-alert"', "");
      alertBox.innerText = `❌ Помилка: ${result.message || "Транзакцію відхилено"}`;
    }
  } catch (error) {
    alertBox.classList.remove("hidden");
    alertBox.classList.add("bg-red-100", "text-red-800");
    alertBox.innerText = "❌ Системна помилка підключення до сервера банку.";
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = "Надіслати платіж";
  }
}
