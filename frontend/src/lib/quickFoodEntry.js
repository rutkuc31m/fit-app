const DIACRITICS = /[\u0300-\u036f]/g;

export const normalizeQuickText = (value = "") =>
  String(value)
    .normalize("NFKD")
    .replace(DIACRITICS, "")
    .toLowerCase()
    .replace(/["'`´]/g, "")
    .replace(/[^a-z0-9äöüßğışçéèêñ\s.-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const stripFillers = (value = "") => {
  const text = normalizeQuickText(value);
  return text
    .replace(/\b(?:ekle|tak|yaz|koy|al|ver|dicem|diyorum|söyle|soyle|please|add|put|food|meal|item|gram|gr|g)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const parseAmount = (value) => {
  const n = Number(String(value).replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
};

const normalizeUnit = (unit = "") =>
  normalizeQuickText(unit)
    .replace(/\b(essl?offel|tbsp|tablespoon)\b/g, "el")
    .replace(/\b(teel?offel|tsp|teaspoon)\b/g, "tl")
    .replace(/\b(stuck|stueck)\b/g, "stueck");

const amountFromMatch = (match) => {
  if (!match) return null;
  return parseAmount(match[2] || match[3] || match[1]);
};

const pickMeasureAmount = (unitText = "", count = 1) => {
  const unit = normalizeUnit(unitText);
  if (/\b(el)\b/.test(unit)) return count * 15;
  if (/\b(tl)\b/.test(unit)) return count * 5;
  return null;
};

const wordToCount = (value = "") => {
  const v = normalizeQuickText(value);
  if (!v) return null;
  if (/^(ein|eine|einen|einem|einer|1)$/i.test(v)) return 1;
  const n = parseAmount(v);
  return n;
};

export function parseQuickFoodEntry(input = "") {
  const original = String(input).trim();
  if (!original) return null;
  const normalized = normalizeQuickText(original);
  if (!normalized) return null;

  const amountRegex = /(^|\s)(\d+(?:[.,]\d+)?)\s*(g|gr|gram|gramm|kgs?|kg|adet|adetler|piece|pieces|stk|stuck|stueck|piece(?:s)?|el|essl?offel|tbsp|tablespoon|tl|teel?offel|tsp|teaspoon)\b/ig;
  const firstAmount = amountRegex.exec(normalized);

  let amount = null;
  let unit = "g";
  let query = normalized;
  let kind = "name";

  if (firstAmount) {
    const unitRaw = firstAmount[3] || "";
    const count = amountFromMatch(firstAmount);
    unit = /kg|kilo/i.test(unitRaw) ? "kg"
      : /(adet|piece|pieces|stk|stuck|stueck)/i.test(unitRaw) ? "piece"
      : /(el|essl?offel|tbsp|tablespoon|tl|teel?offel|tsp|teaspoon)/i.test(unitRaw) ? "g"
      : "g";
    amount = /(el|essl?offel|tbsp|tablespoon|tl|teel?offel|tsp|teaspoon)/i.test(unitRaw)
      ? pickMeasureAmount(unitRaw, count)
      : count;
    const before = normalized.slice(0, firstAmount.index).trim();
    const after = normalized.slice(firstAmount.index + firstAmount[0].length).trim();
    query = stripFillers(`${before} ${after}`);
    kind = unit === "piece" ? "piece" : "mass";
  } else {
    const spoonRegex = /(^|\s)(ein|1|eine|einen|einem|einer)?\s*(halbe?r?|ganze?r?)?\s*(el|essl?offel|tbsp|tablespoon|tl|teel?offel|tsp|teaspoon)\b/ig;
    const firstSpoon = spoonRegex.exec(normalized);
    if (firstSpoon) {
      const base = wordToCount(firstSpoon[2]) || 1;
      const modifier = /halb|halbe|halbes/i.test(firstSpoon[3] || "") ? 0.5 : 1;
      amount = pickMeasureAmount(firstSpoon[4], base * modifier);
      unit = "g";
      const before = normalized.slice(0, firstSpoon.index).trim();
      const after = normalized.slice(firstSpoon.index + firstSpoon[0].length).trim();
      query = stripFillers(`${before} ${after}`);
      kind = "mass";
    } else {
      const pieceRegex = /(^|\s)(\d+(?:[.,]\d+)?)\s*(x|adet|adetler|piece|pieces|stk|stuck|stueck)\b/ig;
      const firstPiece = pieceRegex.exec(normalized);
      if (firstPiece) {
        amount = amountFromMatch(firstPiece);
        unit = "piece";
        const before = normalized.slice(0, firstPiece.index).trim();
        const after = normalized.slice(firstPiece.index + firstPiece[0].length).trim();
        query = stripFillers(`${before} ${after}`);
        kind = "piece";
      } else {
        const bareNumber = normalized.match(/(^|\s)(\d+(?:[.,]\d+)?)(\s+|$)/);
        if (bareNumber) {
          amount = amountFromMatch(bareNumber);
          const before = normalized.slice(0, bareNumber.index).trim();
          const after = normalized.slice(bareNumber.index + bareNumber[0].length).trim();
          query = stripFillers(`${before} ${after}`);
          kind = "count";
        } else {
          query = stripFillers(normalized);
          if (/\b(halb|halbe|halbes)\b/.test(query) && /\b(zitrone|zitron|lemon|limon|zitronensaft)\b/.test(query)) {
            amount = 0.5;
            unit = "piece";
            query = stripFillers(query.replace(/\b(halb|halbe|halbes)\b/g, ""));
            kind = "piece";
          }
        }
      }
    }
  }

  query = stripFillers(query);
  if (amount != null) {
    query = query.replace(/\b(ein|eine|einen|einem|einer)\b/g, " ").replace(/\s+/g, " ").trim();
  }
  if (!query) {
    query = stripFillers(original);
  }
  if (!query) return null;

  return { original, amount, unit, query, kind };
}

export function pickBestFoodMatch(results = [], query = "") {
  if (!Array.isArray(results) || results.length === 0) return null;
  const q = normalizeQuickText(query);
  const words = q.split(" ").filter((word) => word.length > 2);

  const scored = results.map((item, index) => {
    const name = normalizeQuickText([item.brand, item.name].filter(Boolean).join(" "));
    let score = 0;
    if (!name) return { item, score: -1, index };
    if (name === q) score += 24;
    if (name.startsWith(q) || q.startsWith(name)) score += 10;
    if (name.includes(q)) score += 8;
    for (const word of words) {
      if (name.includes(word)) score += 3;
    }
    return { item, score, index };
  });

  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  return scored[0]?.item || results[0] || null;
}
