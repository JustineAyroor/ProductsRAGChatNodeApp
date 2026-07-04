const { ChromaClient } = require("chromadb");
const { DefaultEmbeddingFunction } = require("@chroma-core/default-embed");
const { loadKnowledgeDocuments, formatContext } = require("./knowledgeDocuments");

const DEFAULT_CHROMA_URL = "http://localhost:8000";
const DEFAULT_COLLECTION = "employee_knowledge";
const DEFAULT_TOP_K = 5;

function envInt(name, fallback) {
  const value = parseInt(process.env[name] || "", 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function getChromaUrl() {
  return process.env.CHROMA_URL || DEFAULT_CHROMA_URL;
}

function getCollectionName() {
  return process.env.CHROMA_COLLECTION || DEFAULT_COLLECTION;
}

function getTopK() {
  return envInt("VECTOR_TOP_K", DEFAULT_TOP_K);
}

function createChromaClient() {
  const url = new URL(getChromaUrl());
  return new ChromaClient({
    host: url.hostname,
    port: Number(url.port || (url.protocol === "https:" ? 443 : 80)),
    ssl: url.protocol === "https:",
  });
}

function createEmbeddingFunction() {
  return new DefaultEmbeddingFunction();
}

async function getCollection({ create = true } = {}) {
  const client = createChromaClient();
  const embeddingFunction = createEmbeddingFunction();
  const name = getCollectionName();

  if (create) {
    return client.getOrCreateCollection({
      name,
      embeddingFunction,
      metadata: {
        app: "employee-chatbot",
        source: "local-knowledge",
      },
    });
  }

  return client.getCollection({ name, embeddingFunction });
}

async function rebuildVectorIndex() {
  const client = createChromaClient();
  const collectionName = getCollectionName();
  const documents = loadKnowledgeDocuments();

  try {
    await client.deleteCollection({ name: collectionName });
  } catch (err) {
    const message = String(err?.message || "").toLowerCase();
    if (!message.includes("not found") && !message.includes("could not be found")) {
      throw err;
    }
  }

  const collection = await client.getOrCreateCollection({
    name: collectionName,
    embeddingFunction: createEmbeddingFunction(),
    metadata: {
      app: "employee-chatbot",
      source: "local-knowledge",
      indexedAt: new Date().toISOString(),
    },
  });

  if (documents.length > 0) {
    await collection.upsert({
      ids: documents.map((doc) => doc.id),
      documents: documents.map((doc) => doc.content),
      metadatas: documents.map((doc) => doc.metadata),
    });
  }

  return {
    collection: collectionName,
    count: documents.length,
    ids: documents.map((doc) => doc.id),
  };
}

async function retrieveVectorDocuments(query, topK = getTopK()) {
  if (!query || !query.trim()) return [];

  const collection = await getCollection({ create: false });
  const results = await collection.query({
    queryTexts: [query],
    nResults: topK,
    include: ["documents", "metadatas", "distances"],
  });

  const docs = results.documents?.[0] || [];
  const metadatas = results.metadatas?.[0] || [];
  const distances = results.distances?.[0] || [];

  return docs
    .map((content, index) => ({
      content,
      source: metadatas[index]?.source || "Knowledge Base",
      metadata: metadatas[index] || {},
      distance: distances[index],
    }))
    .filter((doc) => doc.content);
}

async function retrieveVectorContext(query, topK = getTopK()) {
  const documents = await retrieveVectorDocuments(query, topK);
  return formatContext(documents);
}

module.exports = {
  createChromaClient,
  getCollectionName,
  getChromaUrl,
  getTopK,
  rebuildVectorIndex,
  retrieveVectorDocuments,
  retrieveVectorContext,
};
