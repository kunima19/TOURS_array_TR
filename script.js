const cardInput = document.getElementById("cardInput");
const addCardButton = document.getElementById("addCardButton");
const selectedCards = document.getElementById("selectedCards");
const patternCount = document.getElementById("patternCount");
const results = document.getElementById("results");

let enteredCards = [];

addCardButton.addEventListener("click", addCard);
cardInput.addEventListener("keydown", event => {
  if (event.key === "Enter") addCard();
});

function normalize(value) {
  const v = value.trim();
  if (!/^\d{1,3}$/.test(v)) return null;
  return v.padStart(3, "0");
}

function addCard() {
  const card = normalize(cardInput.value);
  if (!card) {
    showError("カード番号を正しく入力してください。");
    return;
  }
  enteredCards.push(card);
  cardInput.value = "";
  renderSelectedCards();
  search();
  cardInput.focus();
}

function removeCard(index) {
  enteredCards.splice(index, 1);
  renderSelectedCards();
  search();
}

function renderSelectedCards() {
  if (enteredCards.length === 0) {
    selectedCards.innerHTML =
      '<span class="empty-message"></span>';
    return;
  }

  selectedCards.innerHTML = enteredCards.map((card, index) => `
    <div class="selected-card">
      <span>${card}</span>
      <button onclick="removeCard(${index})" aria-label="${card}を削除">×</button>
    </div>
  `).join("");
}

function search() {
  if (enteredCards.length < 2) {
    patternCount.textContent = "0";
    results.innerHTML = "";
    return;
  }
  const matches = sequences.filter(sequence =>
    containsSequence(sequence.cards, enteredCards)
  );
  patternCount.textContent = matches.length;
  if (!matches.length) {
    showError(`「${enteredCards.join(" → ")}」に一致する配列はありません。`);
    return;
  }
  results.innerHTML = matches.map(renderPattern).join("");
}

function containsSequence(cards, target) {
  if (target.length > cards.length) return false;
  for (let start = 0; start <= cards.length - target.length; start++) {
    if (
      target.every((card, index) => {
        const sequenceCard = cards[start + index];
        if (Array.isArray(sequenceCard)) {
          return sequenceCard.includes(card);
        }
        return sequenceCard === card;
      })
    ) {
      return true;
    }
  }
  return false;
}

function renderPattern(sequence) {
  const startIndex = findStartIndex(sequence.cards, enteredCards);
  let endIndex = sequence.cards.length;
  for (let i = startIndex; i < sequence.cards.length; i++) {
  const card = sequence.cards[i];
  if (Array.isArray(card)) {
    if (card.some(candidate => rarityMap[candidate] === "TSSR")) {
      endIndex = i + 1;
      break;
    }
  }
  else if (rarityMap[card] === "TSSR") {
    endIndex = i + 1;
    break;
  }
}

let tsrCount = null;
for (let i = startIndex + 1; i < sequence.cards.length; i++) {
  const card = sequence.cards[i];
  if (Array.isArray(card)) {
    if (card.some(candidate => rarityMap[candidate] === "TSR")) {
      tsrCount = i - startIndex - 1;
      break;
    }
  } else if (rarityMap[card] === "TSR") {
    tsrCount = i - startIndex - 1;
    break;
  }
}

let tssrCount = null;
for (let i = startIndex + 1; i < sequence.cards.length; i++) {
  const card = sequence.cards[i];
  if (Array.isArray(card)) {
    if (card.some(candidate => rarityMap[candidate] === "TSSR")) {
      tssrCount = i - startIndex - 1;
      break;
    }
  } else if (rarityMap[card] === "TSSR") {
    tssrCount = i - startIndex - 1;
    break;
  }
}
    const visibleCards = sequence.cards.slice(startIndex, endIndex);

    const allCards = sequence.cards.slice(startIndex, 100);
    const patternKey = `${sequence.id}-${startIndex}`;

    return `
      <article class="pattern">
        <header class="pattern-header">
          <span>◉</span>
          <span>${sequence.id}</span>
          <div class="pattern-actions">
          </div>
        </header>

        <div class="pattern-body">
          <div class="rarity-counts">
            <div class="tsr-count">
              TSRまで：${tsrCount === null ? "―" : tsrCount + "枚"}
            </div>
            <div class="tssr-count">
              TSSRまで：${tssrCount === null ? "―" : tssrCount + "枚"}
            </div>
          </div>

          <div class="sequence-scroll">
            <div
              class="sequence"
              id="sequence-${patternKey}"
            >
              ${visibleCards.map((card, index) =>
                createCard(
                  card,
                  Array.isArray(card)
                    ? card.some(candidate => enteredCards.includes(candidate))
                    : enteredCards.includes(card),
                  startIndex + index + 1
                )
              ).join('<div class="arrow">→</div>')}

            <button
              class="show-all-button"
              onclick="toggleAllCards('${patternKey}')"
              >
               全て表示
              </button>
            </div>
          </div>
        </div>
      </article>
    `;
}

function findStartIndex(cards, target) {
  for (let start = 0; start <= cards.length - target.length; start++) {
    if (
      target.every((card, index) => {
        const sequenceCard = cards[start + index];
        if (Array.isArray(sequenceCard)) {
          return sequenceCard.includes(card);
        }
        return sequenceCard === card;
      })
    ) {
      return start;
    }
  }
  return 0;
}

function createCard(card, current, position) {
  if (Array.isArray(card)) {
    return `
      <div class="card random-card ${current ? "current" : ""}">
        <div class="card-position">${position}番目</div>
        <div class="random-cards">
          ${card.map(candidate => `
            <div class="random-candidate">
              <img src="img/${candidate}.png" alt="${candidate}">
              <div class="card-number">${candidate}</div>
              <div class="card-rarity">
                ${rarityMap[candidate] || "不明"}
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  return `
    <div class="card ${current ? "current" : ""}">
      <div class="card-position">${position}番目</div>
      <img src="img/${card}.png" alt="${card}">
      <div class="card-number">${card}</div>
      <div class="card-rarity">
        ${rarityMap[card] || "不明"}
      </div>
    </div>
  `;
}

function showError(message) {
  patternCount.textContent = "0";
  results.innerHTML = `<div class="error">${message}</div>`;
}

function toggleAllCards(patternKey) {
  const [sequenceId] = patternKey.split("-");
  const sequence = sequences.find(s => s.id === sequenceId);
  if (!sequence) return;

  const container = document.getElementById(`sequence-${patternKey}`);
  if (!container) return;

  const allCards = sequence.cards.slice(0, 100);

  container.innerHTML = allCards.map((card, index) =>
    createCard(
      card,
      Array.isArray(card)
        ? card.some(candidate => enteredCards.includes(candidate))
        : enteredCards.includes(card),
      index + 1
    )
  ).join('<div class="arrow">→</div>');

  const newStartIndex = findStartIndex(allCards, enteredCards);

  const scrollArea = container.parentElement;
  const targetCard = container.children[newStartIndex * 2];

  if (targetCard) {
    scrollArea.scrollLeft = targetCard.offsetLeft;
  }
}