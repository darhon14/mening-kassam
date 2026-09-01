const app = document.getElementById("app");

const STORAGE_KEY = "cashTransactions";
const STARTING_BALANCE_KEY = "cashStartingBalance";
const PIN_KEY = "cashPin";
const LOCK_KEY = "cashPinEnabled";

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
"Солиқ",
"Бошқа"
];

let transactions = JSON.parse(
localStorage.getItem(STORAGE_KEY) || "[]"
);

let startingBalance = Number(
localStorage.getItem(STARTING_BALANCE_KEY) || "0"
);

let currentType = "income";
let editingId = null;
let activePeriod = "all";
let searchText = "";
let filterType = "all";
let filterCategory = "all";

function saveData() {
localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
localStorage.setItem(
STARTING_BALANCE_KEY,
String(startingBalance)
);
}

function money(value) {
return (
new Intl.NumberFormat("uz-UZ").format(
Number(value) || 0
) + " сўм"
);
}

function escapeHTML(value) {
return String(value ?? "")
.replace(/&/g, "&")
.replace(/</g, "<")
.replace(/>/g, ">")
.replace(/"/g, """)
.replace(/'/g, "'");
}

function getDateObject(item) {
const date = new Date(item.createdAt || item.date);

if (Number.isNaN(date.getTime())) {
return new Date();
}

return date;
}

function formatDate(date) {
return new Intl.DateTimeFormat("uz-UZ", {
day: "2-digit",
month: "2-digit",
year: "numeric",
hour: "2-digit",
minute: "2-digit"
}).format(date);
}

function dateKey(date) {
const year = date.getFullYear();
const month = String(date.getMonth() + 1).padStart(2, "0");
const day = String(date.getDate()).padStart(2, "0");

return `${year}-${month}-${day}`;
}

function calculate(list = transactions) {
let income = 0;
let expense = 0;

list.forEach((item) => {
if (item.type === "income") {
income += Number(item.amount) || 0;
} else {
expense += Number(item.amount) || 0;
}
});

return {
income,
expense,
balance: startingBalance + income - expense
};
}

function normalizeOldData() {
let changed = false;

transactions = transactions.map((item) => {
const normalized = {
...item,
amount: Number(item.amount) || 0,
category: item.category || "Бошқа",
note: item.note || "",
type: item.type === "expense" ? "expense" : "income",
createdAt:
item.createdAt ||
new Date().toISOString()
};

```
if (!item.createdAt) {
  changed = true;
}

return normalized;
```

});

if (changed) {
saveData();
}
}

function getFilteredTransactions() {
const now = new Date();

return transactions.filter((item) => {
const date = getDateObject(item);

```
if (activePeriod === "today") {
  if (dateKey(date) !== dateKey(now)) {
    return false;
  }
}

if (activePeriod === "month") {
  if (
    date.getFullYear() !== now.getFullYear() ||
    date.getMonth() !== now.getMonth()
  ) {
    return false;
  }
}

if (
  filterType !== "all" &&
  item.type !== filterType
) {
  return false;
}

if (
  filterCategory !== "all" &&
  item.category !== filterCategory
) {
  return false;
}

if (searchText) {
  const text = `
    ${item.category}
    ${item.note}
    ${item.amount}
  `.toLowerCase();

  if (!text.includes(searchText.toLowerCase())) {
    return false;
  }
}

return true;
```

});
}

function getAllCategories() {
return [
...new Set([
...incomeCategories,
...expenseCategories,
...transactions.map((item) => item.category)
])
];
}

function render() {
const result = calculate();
const filtered = getFilteredTransactions();

const periodResult = calculate(filtered);

app.innerHTML = ` <div class="app">

```
  <header class="header">
    <div class="header-top">
      <div>
        <h1>💰 Менинг Кассам</h1>
        <p>Кирим ва чиқим назорати</p>
      </div>

      <button id="settingsButton" class="icon-button">
        ⚙️
      </button>
    </div>
  </header>

  <main>

    <section class="balance-card">
      <div class="label">Жорий қолдиқ</div>
      <div class="balance">
        ${money(result.balance)}
      </div>

      <div class="starting-info">
        Бошланғич: ${money(startingBalance)}
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

    <section class="report-card">

      <div class="section-heading">
        <h2>📊 Ҳисобот</h2>
      </div>

      <div class="period-buttons">
        <button
          class="${activePeriod === "today" ? "active" : ""}"
          data-period="today"
        >
          Бугун
        </button>

        <button
          class="${activePeriod === "month" ? "active" : ""}"
          data-period="month"
        >
          Бу ой
        </button>

        <button
          class="${activePeriod === "all" ? "active" : ""}"
          data-period="all"
        >
          Ҳаммаси
        </button>
      </div>

      <div class="report-grid">

        <div>
          <span>Кирим</span>
          <strong class="green">
            ${money(periodResult.income)}
          </strong>
        </div>

        <div>
          <span>Чиқим</span>
          <strong class="red">
            ${money(periodResult.expense)}
          </strong>
        </div>

        <div>
          <span>Фарқ</span>
          <strong>
            ${money(
              periodResult.income -
              periodResult.expense
            )}
          </strong>
        </div>

      </div>

    </section>

    <section class="operations">

      <div class="operations-title">
        <h2>Операциялар</h2>

        ${
          transactions.length
            ? `
              <button
                id="clearButton"
                class="clear-button"
              >
                Ҳаммасини ўчириш
              </button>
            `
            : ""
        }
      </div>

      <div class="filters">

        <input
          id="searchInput"
          type="search"
          placeholder="🔎 Қидириш..."
          value="${escapeHTML(searchText)}"
        />

        <select id="typeFilter">
          <option value="all">Барчаси</option>
          <option
            value="income"
            ${filterType === "income" ? "selected" : ""}
          >
            Кирим
          </option>
          <option
            value="expense"
            ${filterType === "expense" ? "selected" : ""}
          >
            Чиқим
          </option>
        </select>

        <select id="categoryFilter">

          <option value="all">Барча категория</option>

          ${getAllCategories()
            .map(
              (category) => `
                <option
                  value="${escapeHTML(category)}"
                  ${
                    filterCategory === category
                      ? "selected"
                      : ""
                  }
                >
                  ${escapeHTML(category)}
                </option>
              `
            )
            .join("")}

        </select>

      </div>

      <div class="transaction-count">
        ${filtered.length} та операция
      </div>

      <div class="transaction-list">

        ${
          filtered.length === 0
            ? `
              <div class="empty">
                ${
                  transactions.length
                    ? "Фильтр бўйича операция топилмади."
                    : "Ҳозирча операциялар йўқ."
                }
              </div>
            `
            : filtered
                .map((item) => {
                  const income =
                    item.type === "income";

                  return `
                    <div class="transaction">

                      <div class="transaction-info">

                        <div class="transaction-title-row">
                          <strong>
                            ${escapeHTML(
                              item.category
                            )}
                          </strong>

                          <span class="type-badge ${
                            income
                              ? "income-badge"
                              : "expense-badge"
                          }">
                            ${
                              income
                                ? "Кирим"
                                : "Чиқим"
                            }
                          </span>
                        </div>

                        <small>
                          ${
                            escapeHTML(
                              item.note || "Изоҳ йўқ"
                            )
                          }
                        </small>

                        <small>
                          ${escapeHTML(
                            formatDate(
                              getDateObject(item)
                            )
                          )}
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

                        <div class="transaction-actions">

                          <button
                            class="edit-button"
                            data-id="${item.id}"
                            title="Таҳрирлаш"
                          >
                            ✏️
                          </button>

                          <button
                            class="delete-button"
                            data-id="${item.id}"
                            title="Ўчириш"
                          >
                            🗑
                          </button>

                        </div>

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
```

`;

bindEvents();
}

function bindEvents() {
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

document
.getElementById("settingsButton")
.addEventListener("click", showSettings);

document
.querySelectorAll("[data-period]")
.forEach((button) => {
button.addEventListener("click", () => {
activePeriod = button.dataset.period;
render();
});
});

const searchInput =
document.getElementById("searchInput");

searchInput.addEventListener("input", () => {
searchText = searchInput.value;
render();
const newInput =
document.getElementById("searchInput");

```
newInput.focus();
newInput.setSelectionRange(
  newInput.value.length,
  newInput.value.length
);
```

});

document
.getElementById("typeFilter")
.addEventListener("change", (event) => {
filterType = event.target.value;
render();
});

document
.getElementById("categoryFilter")
.addEventListener("change", (event) => {
filterCategory = event.target.value;
render();
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

```
    if (
      confirm(
        "Бу операцияни ўчиришни хоҳлайсизми?"
      )
    ) {
      transactions = transactions.filter(
        (item) => item.id !== id
      );

      saveData();
      render();
    }
  });
});
```

document
.querySelectorAll(".edit-button")
.forEach((button) => {
button.addEventListener("click", () => {
const id = Number(button.dataset.id);

```
    const item = transactions.find(
      (transaction) => transaction.id === id
    );

    if (item) {
      showForm(item.type, item);
    }
  });
});
```

}

function showForm(type, existingItem = null) {
currentType = type;
editingId = existingItem
? existingItem.id
: null;

const income = type === "income";

const categories = income
? incomeCategories
: expenseCategories;

const selectedCategory =
existingItem?.category || categories[0];

document.getElementById("formArea").innerHTML = ` <section class="form-card">

```
  <div class="form-heading">
    <h2>
      ${
        editingId
          ? "✏️ Операцияни таҳрирлаш"
          : income
          ? "＋ Кирим қўшиш"
          : "− Чиқим қўшиш"
      }
    </h2>

    <button id="closeFormButton" class="close-button">
      ×
    </button>
  </div>

  <label>Сумма</label>

  <input
    id="amount"
    type="number"
    inputmode="decimal"
    min="1"
    placeholder="Масалан: 500000"
    value="${
      existingItem
        ? escapeHTML(existingItem.amount)
        : ""
    }"
  />

  <label>Категория</label>

  <select id="category">

    ${categories
      .map(
        (item) =>
          `<option
            value="${escapeHTML(item)}"
            ${
              item === selectedCategory
                ? "selected"
                : ""
            }
          >
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
    value="${
      existingItem
        ? escapeHTML(existingItem.note)
        : ""
    }"
  />

  <div class="form-buttons">

    <button id="saveButton" class="save-button">
      ${editingId ? "Ўзгаришни сақлаш" : "Сақлаш"}
    </button>

    <button id="cancelButton" class="cancel-button">
      Бекор қилиш
    </button>

  </div>

</section>
```

`;

document
.getElementById("saveButton")
.addEventListener("click", saveTransaction);

document
.getElementById("cancelButton")
.addEventListener("click", () => {
editingId = null;
document.getElementById("formArea").innerHTML = "";
});

document
.getElementById("closeFormButton")
.addEventListener("click", () => {
editingId = null;
document.getElementById("formArea").innerHTML = "";
});

document
.getElementById("amount")
.focus();
}

function saveTransaction() {
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

if (editingId !== null) {
const index = transactions.findIndex(
(item) => item.id === editingId
);

```
if (index !== -1) {
  transactions[index] = {
    ...transactions[index],
    type: currentType,
    amount,
    category,
    note
  };
}
```

} else {
transactions.unshift({
id: Date.now(),
type: currentType,
amount,
category,
note,
createdAt: new Date().toISOString()
});
}

saveData();

editingId = null;
render();
}

function showSettings() {
const pinEnabled =
localStorage.getItem(LOCK_KEY) === "true";

app.innerHTML = ` <div class="app">

```
  <header class="header">
    <div class="header-top">
      <div>
        <h1>⚙️ Созламалар</h1>
        <p>Менинг Кассам</p>
      </div>

      <button
        id="backButton"
        class="icon-button"
      >
        ←
      </button>
    </div>
  </header>

  <main class="settings-page">

    <section class="settings-card">

      <h2>💰 Бошланғич қолдиқ</h2>

      <p>
        Кассада дастурни бошлаган пайтда мавжуд
        бўлган пул миқдорини киритинг.
      </p>

      <input
        id="startingBalanceInput"
        type="number"
        inputmode="decimal"
        min="0"
        value="${startingBalance}"
        placeholder="Масалан: 5000000"
      />

      <button
        id="saveStartingBalance"
        class="primary-settings-button"
      >
        Сақлаш
      </button>

    </section>

    <section class="settings-card">

      <h2>🔐 PIN-код</h2>

      <p>
        PIN-код ёқилса, кассани очганда PIN сўралади.
      </p>

      <label class="switch-row">
        <span>PIN-кодни ёқиш</span>

        <input
          id="pinToggle"
          type="checkbox"
          ${pinEnabled ? "checked" : ""}
        />

      </label>

      <button
        id="changePinButton"
        class="secondary-settings-button"
      >
        ${
          pinEnabled
            ? "PIN-кодни ўзгартириш"
            : "PIN-код ўрнатиш"
        }
      </button>

    </section>

    <section class="settings-card">

      <h2>💾 Маълумотлар</h2>

      <p>
        Маълумотларни файлга сақланг ёки кейин қайта тикланг.
      </p>

      <div class="settings-buttons">

        <button
          id="backupButton"
          class="primary-settings-button"
        >
          📤 Backup
        </button>

        <button
          id="restoreButton"
          class="secondary-settings-button"
        >
          📥 Restore
        </button>

      </div>

      <input
        id="restoreInput"
        type="file"
        accept=".json,application/json"
        hidden
      />

    </section>

    <section class="settings-card danger-card">

      <h2>⚠️ Хавфли амал</h2>

      <p>
        Барча операцияларни ўчиради.
      </p>

      <button
        id="deleteAllDataButton"
        class="danger-button"
      >
        Барча маълумотларни ўчириш
      </button>

    </section>

  </main>

</div>
```

`;

document
.getElementById("backButton")
.addEventListener("click", render);

document
.getElementById("saveStartingBalance")
.addEventListener("click", () => {
const value = Number(
document.getElementById(
"startingBalanceInput"
).value
);

```
  if (!Number.isFinite(value) || value < 0) {
    alert("Қолдиқни тўғри киритинг.");
    return;
  }

  startingBalance = value;
  saveData();

  alert("Бошланғич қолдиқ сақланди.");
  render();
});
```

document
.getElementById("pinToggle")
.addEventListener("change", (event) => {
if (event.target.checked) {
const pin = prompt(
"4 рақамли PIN-код киритинг:"
);

```
    if (!/^\d{4}$/.test(pin || "")) {
      event.target.checked = false;
      alert(
        "PIN-код айнан 4 та рақамдан иборат бўлиши керак."
      );
      return;
    }

    localStorage.setItem(PIN_KEY, pin);
    localStorage.setItem(LOCK_KEY, "true");

    alert("PIN-код ёқилди.");
  } else {
    localStorage.removeItem(PIN_KEY);
    localStorage.setItem(LOCK_KEY, "false");
    alert("PIN-код ўчирилди.");
  }
});
```

document
.getElementById("changePinButton")
.addEventListener("click", () => {
const currentPin =
localStorage.getItem(PIN_KEY);

```
  if (currentPin) {
    const oldPin = prompt(
      "Ҳозирги PIN-кодни киритинг:"
    );

    if (oldPin !== currentPin) {
      alert("PIN-код нотўғри.");
      return;
    }
  }

  const newPin = prompt(
    "Янги 4 рақамли PIN-код:"
  );

  if (!/^\d{4}$/.test(newPin || "")) {
    alert(
      "PIN-код айнан 4 та рақамдан иборат бўлиши керак."
    );
    return;
  }

  localStorage.setItem(PIN_KEY, newPin);
  localStorage.setItem(LOCK_KEY, "true");

  alert("Янги PIN-код сақланди.");
  showSettings();
});
```

document
.getElementById("backupButton")
.addEventListener("click", backupData);

document
.getElementById("restoreButton")
.addEventListener("click", () => {
document
.getElementById("restoreInput")
.click();
});

document
.getElementById("restoreInput")
.addEventListener("change", restoreData);

document
.getElementById("deleteAllDataButton")
.addEventListener("click", () => {
const answer = prompt(
"Ўчириш учун DELETE деб ёзинг:"
);

```
  if (answer !== "DELETE") {
    return;
  }

  transactions = [];
  startingBalance = 0;
  saveData();

  alert("Барча маълумотлар ўчирилди.");
  render();
});
```

}

function backupData() {
const backup = {
app: "Менинг Кассам",
version: 1,
exportedAt: new Date().toISOString(),
startingBalance,
transactions
};

const blob = new Blob(
[JSON.stringify(backup, null, 2)],
{
type: "application/json"
}
);

const url = URL.createObjectURL(blob);
const link = document.createElement("a");

link.href = url;

const date = new Date()
.toISOString()
.slice(0, 10);

link.download = `mening-kassam-backup-${date}.json`;

document.body.appendChild(link);
link.click();
link.remove();

URL.revokeObjectURL(url);
}

function restoreData(event) {
const file = event.target.files[0];

if (!file) {
return;
}

const reader = new FileReader();

reader.onload = () => {
try {
const backup = JSON.parse(reader.result);

```
  if (
    !backup ||
    !Array.isArray(backup.transactions)
  ) {
    throw new Error("Нотўғри backup");
  }

  if (
    !confirm(
      "Backup'даги маълумотлар ҳозирги маълумотларни алмаштиради. Давом этасизми?"
    )
  ) {
    event.target.value = "";
    return;
  }

  transactions = backup.transactions.map(
    (item) => ({
      ...item,
      amount: Number(item.amount) || 0,
      type:
        item.type === "expense"
          ? "expense"
          : "income",
      category:
        item.category || "Бошқа",
      note: item.note || "",
      createdAt:
        item.createdAt ||
        new Date().toISOString()
    })
  );

  startingBalance =
    Number(backup.startingBalance) || 0;

  saveData();

  alert("Backup муваффақиятли тикланди.");
  render();
} catch {
  alert(
    "Backup файлини ўқиб бўлмади. Тўғри JSON файл танланг."
  );
}

event.target.value = "";
```

};

reader.readAsText(file);
}

function checkPin() {
const enabled =
localStorage.getItem(LOCK_KEY) === "true";

const pin =
localStorage.getItem(PIN_KEY);

if (!enabled || !pin) {
return true;
}

const entered = prompt(
"🔐 Менинг Кассам\n\nPIN-кодни киритинг:"
);

if (entered === pin) {
return true;
}

alert("PIN-код нотўғри.");

return false;
}

normalizeOldData();

if (checkPin()) {
render();
} else {
app.innerHTML = ` <div class="locked-screen"> <div class="lock-box"> <div class="lock-icon">🔐</div> <h1>Менинг Кассам</h1> <p>Дастур PIN-код билан ҳимояланган.</p>

```
    <button
      id="unlockButton"
      class="save-button"
    >
      Қайта уриниш
    </button>
  </div>
</div>
```

`;

document
.getElementById("unlockButton")
.addEventListener("click", () => {
if (checkPin()) {
render();
}
});
}
