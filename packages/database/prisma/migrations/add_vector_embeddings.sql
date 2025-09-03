-- Create vector_embeddings table for our in-house vector store
CREATE TABLE IF NOT EXISTS vector_embeddings (
    id VARCHAR(255) PRIMARY KEY,
    collection VARCHAR(100) NOT NULL,
    embedding JSONB NOT NULL, -- Store as JSONB for now, can migrate to pgvector later
    metadata JSONB DEFAULT '{}',
    dimension INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_vector_collection (collection),
    INDEX idx_vector_metadata USING GIN (metadata),
    INDEX idx_vector_created (created_at DESC)
);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_vector_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update timestamp
CREATE TRIGGER update_vector_embeddings_timestamp
BEFORE UPDATE ON vector_embeddings
FOR EACH ROW
EXECUTE FUNCTION update_vector_timestamp();

-- Add comments for documentation
COMMENT ON TABLE vector_embeddings IS 'In-house vector store for semantic search and AI operations';
COMMENT ON COLUMN vector_embeddings.embedding IS 'Vector representation stored as JSONB array';
COMMENT ON COLUMN vector_embeddings.collection IS 'Namespace for organizing vectors (conversations, skills, insights, etc.)';
COMMENT ON COLUMN vector_embeddings.metadata IS 'Additional searchable metadata for filtering';