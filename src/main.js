const app = document.getElementById("app");

let transactions = JSON.parse(
  localStorage.getItem("cashTransactions") || "[]"
);

const incomeCategories = [
  "Савдо",
  "Хизмат",
  "Қарз қайтиши",
  "Бошқа"
];

const expenseCategories = [
  "Товар хариди",
  "Ижара",
  "Транспорт",
  "Ойлик",
  "Коммунал",
  "Бошқа"
];

let currentType = "income";

function saveData() {
  localStorage.setItem(
    "cashTransactions",
    JSON.stringify(transactions)
  );
}

function money(value) {
  return (
    new Intl.NumberFormat("uz-UZ").format(value) +
    " сўм"
  );
}

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function calculate() {
  let income = 0;
  let expense = 0;

  transactions.forEach((item) => {
    if (item.type === "income") {
      income += Number(item.amount);
    } else {
      expense += Number(item.amount);
    }
  });

  return {
    income,
    expense,
    balance: income - expense
  };
}

function render() {
  const result = calculate();

  app.innerHTML = `
    <div class="app">

      <header class="header">
        <h1>💰 Менинг Кассам</h1>
        <p>Кирим ва чиқим назорати</p>
      </header>

      <main>

        <section class="balance-card">
          <div class="label">Жорий қолдиқ</div>
          <div class="balance">
            ${money(result.balance)}
          </div>
        </section>

        <section class="summary">

          <div class="summary-card income-card">
            <span>Кирим</span>
            <strong>${money(result.income)}</strong>
          </div>

          <div class="summary-card expense-card">
            <span>Чиқим</span>
            <strong>${money(result.expense)}</strong>
          </div>

        </section>

        <section class="action-buttons">

          <button
            class="income-button"
            id="incomeButton"
          >
            ＋ Кирим
          </button>

          <button
            class="expense-button"
            id="expenseButton"
          >
            − Чиқим
          </button>

        </section>

        <div id="formArea"></div>

        <section class="operations">

          <div class="operations-title">
            <h2>Операциялар</h2>

            ${
              transactions.length
                ? `
                  <button id="clearButton" class="clear-button">
                    Ҳаммасини ўчириш
                  </button>
                `
                : ""
            }

          </div>

          <div class="transaction-list">

            ${
              transactions.length === 0
                ? `
                  <div class="empty">
                    Ҳозирча операциялар йўқ
                  </div>
                `
                : transactions
                    .map((item) => {
                      const income =
                        item.type === "income";

                      return `
                        <div class="transaction">

                          <div class="transaction-info">

                            <strong>
                              ${escapeHTML(item.category)}
                            </strong>

                            <small>
                              ${
                                escapeHTML(
                                  item.note || "Изоҳ йўқ"
                                )
                              }
                            </small>

                            <small>
                              ${escapeHTML(item.date)}
                            </small>

                          </div>

                          <div class="transaction-right">

                            <strong
                              class="${
                                income
                                  ? "green"
                                  : "red"
                              }"
                            >
                              ${income ? "+" : "-"}
                              ${money(item.amount)}
                            </strong>

                            <button
                              class="delete-button"
                              data-id="${item.id}"
                            >
                              🗑
                            </button>

                          </div>

                        </div>
                      `;
                    })
                    .join("")
            }

          </div>

        </section>

      </main>

    </div>
  `;

  document
    .getElementById("incomeButton")
    .addEventListener("click", () => {
      showForm("income");
    });

  document
    .getElementById("expenseButton")
    .addEventListener("click", () => {
      showForm("expense");
    });

  const clearButton =
    document.getElementById("clearButton");

  if (clearButton) {
    clearButton.addEventListener("click", () => {
      if (
        confirm(
          "Барча операцияларни ўчиришни хоҳлайсизми?"
        )
      ) {
        transactions = [];
        saveData();
        render();
      }
    });
  }

  document
    .querySelectorAll(".delete-button")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const id = Number(button.dataset.id);

        if (
          confirm(
            "Бу операцияни ўчиришни хоҳлайсизми?"
          )
        ) {
          transactions =
            transactions.filter(
              (item) => item.id !== id
            );

          saveData();
          render();
        }
      });
    });
}

function showForm(type) {
  currentType = type;

  const income = type === "income";

  const categories = income
    ? incomeCategories
    : expenseCategories;

  document.getElementById("formArea").innerHTML = `
    <section class="form-card">

      <h2>
        ${income ? "＋ Кирим қўшиш" : "− Чиқим қўшиш"}
      </h2>

      <label>Сумма</label>

      <input
        id="amount"
        type="number"
        inputmode="decimal"
        min="1"
        placeholder="Масалан: 500000"
      />

      <label>Категория</label>

      <select id="category">

        ${categories
          .map(
            (item) =>
              `<option value="${escapeHTML(item)}">
                ${escapeHTML(item)}
              </option>`
          )
          .join("")}

      </select>

      <label>Изоҳ</label>

      <input
        id="note"
        type="text"
        maxlength="100"
        placeholder="Масалан: Товар сотилди"
      />

      <div class="form-buttons">

        <button id="saveButton" class="save-button">
          Сақлаш
        </button>

        <button id="cancelButton" class="cancel-button">
          Бекор қилиш
        </button>

      </div>

    </section>
  `;

  document
    .getElementById("saveButton")
    .addEventListener("click", () => {

      const amount = Number(
        document.getElementById("amount").value
      );

      const category =
        document.getElementById("category").value;

      const note =
        document
          .getElementById("note")
          .value
          .trim();

      if (!Number.isFinite(amount) || amount <= 0) {
        alert("Суммани тўғри киритинг.");
        return;
      }

      transactions.unshift({
        id: Date.now(),
        type: currentType,
        amount,
        category,
        note,
        date: new Date().toLocaleString("uz-UZ")
      });

      saveData();
      render();
    });

  document
    .getElementById("cancelButton")
    .addEventListener("click", () => {
      document.getElementById("formArea").innerHTML = "";
    });

  document.getElementById("amount").focus();
}

render();
