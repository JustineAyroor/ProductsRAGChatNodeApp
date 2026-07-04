require("dotenv").config();

const {
  getChromaUrl,
  getCollectionName,
  rebuildVectorIndex,
} = require("../server/services/vectorKnowledge");

async function main() {
  console.log("Indexing local knowledge into Chroma");
  console.log({
    chromaUrl: getChromaUrl(),
    collection: getCollectionName(),
  });

  const result = await rebuildVectorIndex();

  console.log("Knowledge index complete");
  console.log({
    collection: result.collection,
    count: result.count,
    ids: result.ids,
  });
}

main().catch((err) => {
  console.error("Knowledge indexing failed");
  console.error({
    message: err.message,
  });
  process.exit(1);
});
