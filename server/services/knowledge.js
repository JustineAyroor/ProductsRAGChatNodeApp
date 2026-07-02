const fs = require("fs");
const path = require("path");

const KNOWLEDGE_DIR = path.join(__dirname, "../../knowledge");
let chunks = [];

function expandText(text = "") {
  return String(text)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
}

function tokenize(text) {
  return expandText(text)
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function normalize(text) {
  return tokenize(text).join(" ");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function loadChunks() {
  chunks = [];

  const productsPath = path.join(KNOWLEDGE_DIR, "products.json");
  if (fs.existsSync(productsPath)) {
    const products = JSON.parse(fs.readFileSync(productsPath, "utf-8"));
    for (const product of products) {
      const specs = Object.entries(product.specs || {})
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ");
      const content = [
        `Product: ${product.name}`,
        `SKU: ${product.sku}`,
        `Price: $${product.price}/month`,
        `Category: ${product.category}`,
        `Specs: ${specs}`,
        `Support: ${product.supportNotes}`,
      ].join("\n");
      chunks.push({
        source: product.name,
        type: "product",
        product,
        aliases: unique([
          product.name,
          expandText(product.name),
          product.sku,
          product.category,
        ]),
        content,
      });
    }
  }

  const guidePath = path.join(KNOWLEDGE_DIR, "product-guide.md");
  if (fs.existsSync(guidePath)) {
    const md = fs.readFileSync(guidePath, "utf-8");
    const sections = md.split(/(?=^#{1,3} )/m).filter((s) => s.trim());
    for (const section of sections) {
      const headingMatch = section.match(/^#{1,3}\s+(.+)/);
      const source = headingMatch ? headingMatch[1].trim() : "Product Guide";
      chunks.push({ source, type: "guide", aliases: [source], content: section.trim() });
    }
  }
}

function retrieveContext(query, topK = 5) {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return "";

  const normalizedQuery = normalize(query);
  const asksForProducts =
    /\b(products?|plans?|offerings?|catalog|pricing|prices?)\b/i.test(query) &&
    !normalizedQuery.includes("refund");

  if (asksForProducts && !chunks.some((chunk) => chunk.type === "product" && scoreChunk(chunk, queryTokens, normalizedQuery) >= 8)) {
    return chunks
      .filter((chunk) => chunk.type === "product")
      .map((c) => `[${c.source}]\n${c.content}`)
      .join("\n\n---\n\n");
  }

  const scored = chunks.map((chunk) => {
    const score = scoreChunk(chunk, queryTokens, normalizedQuery);
    return { ...chunk, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const hasStrongProductMatch = scored.some(
    (c) => c.type === "product" && c.score >= 8
  );
  const wantsBroadAnswer =
    /\b(all|list|compare|comparison|products?|plans?|offerings?|catalog)\b/i.test(
      query
    ) && !hasStrongProductMatch;

  const top = scored
    .filter((c) => {
      if (c.score <= 0) return false;
      if (!hasStrongProductMatch || wantsBroadAnswer) return true;
      return c.type === "product" ? c.score >= 8 : c.score >= 4;
    })
    .slice(0, topK);

  if (top.length === 0) {
    return chunks
      .slice(0, 3)
      .map((c) => `[${c.source}]\n${c.content}`)
      .join("\n\n---\n\n");
  }

  return top.map((c) => `[${c.source}]\n${c.content}`).join("\n\n---\n\n");
}

function scoreChunk(chunk, queryTokens, normalizedQuery) {
  const contentTokens = tokenize(chunk.content);
  const contentTokenSet = new Set(contentTokens);
  const normalizedContent = normalize(
    [chunk.source, ...(chunk.aliases || []), chunk.content].join(" ")
  );

  let score = 0;

  for (const token of queryTokens) {
    if (contentTokenSet.has(token)) score += 2;
    if (normalizedContent.includes(token)) score += 1;
  }

  for (const alias of chunk.aliases || []) {
    const normalizedAlias = normalize(alias);
    if (!normalizedAlias) continue;

    if (normalizedQuery.includes(normalizedAlias)) {
      score += chunk.type === "product" ? 12 : 6;
    } else {
      const aliasTokens = tokenize(alias);
      const matchedAliasTokens = aliasTokens.filter((token) =>
        queryTokens.includes(token)
      ).length;
      if (matchedAliasTokens > 0) {
        score += matchedAliasTokens * (chunk.type === "product" ? 4 : 2);
      }
    }
  }

  if (chunk.type === "product" && /\bproduct\b/i.test(queryTokens.join(" "))) {
    score += 1;
  }

  return score;
}

loadChunks();

module.exports = { retrieveContext, loadChunks, tokenize };
