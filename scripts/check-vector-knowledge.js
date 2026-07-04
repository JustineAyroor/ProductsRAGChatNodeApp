require("dotenv").config();

const {
  createChromaClient,
  getChromaUrl,
  getCollectionName,
} = require("../server/services/vectorKnowledge");
const { getRetrievalMode } = require("../server/services/retrieval");

async function main() {
  const client = createChromaClient();
  const collectionName = getCollectionName();

  console.log("Vector retrieval health check");
  console.log({
    retrievalMode: getRetrievalMode(),
    chromaUrl: getChromaUrl(),
    collection: collectionName,
  });

  const heartbeat = await client.heartbeat();
  console.log({ chromaReachable: true, heartbeat });

  const collections = await client.listCollections();
  console.log({
    collections: collections.map((collection) => collection.name || collection),
  });

  const collection = await client.getCollection({ name: collectionName });
  const count = await collection.count();
  console.log({
    collectionFound: true,
    count,
    indexed: count > 0,
  });

  if (count === 0) {
    throw new Error(
      `Collection "${collectionName}" exists but is empty. Run npm run knowledge:index.`
    );
  }
}

main().catch((err) => {
  console.error("Vector retrieval health check failed");
  console.error({
    message: err.message,
  });
  process.exit(1);
});
