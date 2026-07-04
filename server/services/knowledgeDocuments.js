const fs = require("fs");
const path = require("path");

const KNOWLEDGE_DIR = path.join(__dirname, "../../knowledge");

function slugify(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatSpecs(specs = {}) {
  return Object.entries(specs)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
}

function loadKnowledgeDocuments() {
  const documents = [];

  const productsPath = path.join(KNOWLEDGE_DIR, "products.json");
  if (fs.existsSync(productsPath)) {
    const products = JSON.parse(fs.readFileSync(productsPath, "utf-8"));

    for (const product of products) {
      const content = [
        `Product: ${product.name}`,
        `SKU: ${product.sku}`,
        `Price: $${product.price}/month`,
        `Category: ${product.category}`,
        `Specs: ${formatSpecs(product.specs)}`,
        `Support: ${product.supportNotes}`,
      ].join("\n");

      documents.push({
        id: `product:${product.sku}`,
        source: product.name,
        content,
        metadata: {
          source: product.name,
          sourceType: "product",
          sku: product.sku,
          category: product.category,
        },
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

      documents.push({
        id: `guide:${slugify(source) || "product-guide"}`,
        source,
        content: section.trim(),
        metadata: {
          source,
          sourceType: "guide",
        },
      });
    }
  }

  return documents;
}

function formatContext(documents) {
  return documents
    .map((doc) => `[${doc.source}]\n${doc.content}`)
    .join("\n\n---\n\n");
}

module.exports = { loadKnowledgeDocuments, formatContext, slugify };
