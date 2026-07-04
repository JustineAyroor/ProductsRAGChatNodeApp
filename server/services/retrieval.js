const keywordKnowledge = require("./knowledge");
const {
  getChromaUrl,
  getCollectionName,
  retrieveVectorContext,
} = require("./vectorKnowledge");

function getRetrievalMode() {
  return (process.env.RETRIEVAL_MODE || "keyword").trim().toLowerCase();
}

function shouldUseVectorRetrieval() {
  return getRetrievalMode() === "vector";
}

async function retrieveContext(query, topK) {
  if (!shouldUseVectorRetrieval()) {
    return keywordKnowledge.retrieveContext(query, topK);
  }

  try {
    const context = await retrieveVectorContext(query, topK);
    if (context && context.trim()) return context;
  } catch (err) {
    console.warn(
      [
        "[retrieval] Vector retrieval failed; falling back to keyword retrieval.",
        `mode=${getRetrievalMode()}`,
        `chromaUrl=${getChromaUrl()}`,
        `collection=${getCollectionName()}`,
        `error=${err.message}`,
      ].join(" ")
    );
  }

  return keywordKnowledge.retrieveContext(query, topK);
}

module.exports = {
  getRetrievalMode,
  retrieveContext,
  shouldUseVectorRetrieval,
};
