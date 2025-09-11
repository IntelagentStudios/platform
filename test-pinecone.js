// Quick script to check your Pinecone index structure
// Run with: node test-pinecone.js

const { Pinecone } = require('@pinecone-database/pinecone');

async function checkIndex() {
  const pinecone = new Pinecone({
    apiKey: 'YOUR_PINECONE_API_KEY' // Replace with your actual key
  });

  const indexName = 'YOUR_INDEX_NAME'; // Replace with your index name
  const index = pinecone.index(indexName);
  
  // Get index stats
  const stats = await index.describeIndexStats();
  console.log('Index Stats:', JSON.stringify(stats, null, 2));
  
  // Try to fetch a few random vectors to see metadata structure
  try {
    // Query with a random vector just to see metadata
    const queryResponse = await index.query({
      vector: new Array(1536).fill(0.1), // Dummy vector
      topK: 3,
      includeMetadata: true
    });
    
    console.log('\nSample vectors and metadata:');
    queryResponse.matches.forEach((match, i) => {
      console.log(`\nVector ${i + 1}:`);
      console.log('ID:', match.id);
      console.log('Score:', match.score);
      console.log('Metadata:', match.metadata);
    });
  } catch (error) {
    console.log('Error querying:', error.message);
  }
}

checkIndex().catch(console.error);