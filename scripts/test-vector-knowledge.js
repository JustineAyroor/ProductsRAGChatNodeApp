require("dotenv").config();

const {
  getChromaUrl,
  getCollectionName,
  getTopK,
  retrieveVectorDocuments,
} = require("../server/services/vectorKnowledge");

const queries = process.argv.slice(2);
const defaultQueries = [
  "which product supports SCORM",
  "secure password vault compliance",
  "field staff offline mobile forms",
  "how do refunds work",
  "billing dispute escalation",
];

function snippet(text = "") {
  return text.replace(/\s+/g, " ").slice(0, 180);
}

async function main() {
  const testQueries = queries.length > 0 ? queries : defaultQueries;

  console.log("Testing vector knowledge retrieval");
  console.log({
    chromaUrl: getChromaUrl(),
    collection: getCollectionName(),
    topK: getTopK(),
  });

  for (const query of testQueries) {
    const results = await retrieveVectorDocuments(query);

    console.log("\nQUERY:", query);
    if (results.length === 0) {
      console.log("No vector results found.");
      continue;
    }

    for (const [index, result] of results.entries()) {
      console.log(
        `${index + 1}. ${result.source} | distance=${result.distance ?? "n/a"} | ${snippet(result.content)}`
      );
    }
  }
}

main().catch((err) => {
  console.error("Vector retrieval test failed");
  console.error({
    message: err.message,
  });
  process.exit(1);
});
