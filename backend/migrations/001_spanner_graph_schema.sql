-- ACO node tables (one per primitive type)
CREATE TABLE Actors (
  id STRING(64) NOT NULL,
  tenant_id STRING(64) NOT NULL,
  situation_id STRING(64) NOT NULL,
  label STRING(256),
  actor_type STRING(64),
  properties JSON,
  created_at TIMESTAMP NOT NULL OPTIONS (allow_commit_timestamp = true),
) PRIMARY KEY (tenant_id, id);

CREATE TABLE Claims (
  id STRING(64) NOT NULL,
  tenant_id STRING(64) NOT NULL,
  situation_id STRING(64) NOT NULL,
  label STRING(256),
  properties JSON,
  created_at TIMESTAMP NOT NULL OPTIONS (allow_commit_timestamp = true),
) PRIMARY KEY (tenant_id, id);

CREATE TABLE Interests (
  id STRING(64) NOT NULL,
  tenant_id STRING(64) NOT NULL,
  situation_id STRING(64) NOT NULL,
  label STRING(256),
  properties JSON,
  created_at TIMESTAMP NOT NULL OPTIONS (allow_commit_timestamp = true),
) PRIMARY KEY (tenant_id, id);

CREATE TABLE Constraints (
  id STRING(64) NOT NULL,
  tenant_id STRING(64) NOT NULL,
  situation_id STRING(64) NOT NULL,
  label STRING(256),
  properties JSON,
  created_at TIMESTAMP NOT NULL OPTIONS (allow_commit_timestamp = true),
) PRIMARY KEY (tenant_id, id);

CREATE TABLE Leverages (
  id STRING(64) NOT NULL,
  tenant_id STRING(64) NOT NULL,
  situation_id STRING(64) NOT NULL,
  label STRING(256),
  properties JSON,
  created_at TIMESTAMP NOT NULL OPTIONS (allow_commit_timestamp = true),
) PRIMARY KEY (tenant_id, id);

CREATE TABLE Commitments (
  id STRING(64) NOT NULL,
  tenant_id STRING(64) NOT NULL,
  situation_id STRING(64) NOT NULL,
  label STRING(256),
  properties JSON,
  created_at TIMESTAMP NOT NULL OPTIONS (allow_commit_timestamp = true),
) PRIMARY KEY (tenant_id, id);

CREATE TABLE Events (
  id STRING(64) NOT NULL,
  tenant_id STRING(64) NOT NULL,
  situation_id STRING(64) NOT NULL,
  label STRING(256),
  properties JSON,
  created_at TIMESTAMP NOT NULL OPTIONS (allow_commit_timestamp = true),
) PRIMARY KEY (tenant_id, id);

CREATE TABLE Narratives (
  id STRING(64) NOT NULL,
  tenant_id STRING(64) NOT NULL,
  situation_id STRING(64) NOT NULL,
  label STRING(256),
  properties JSON,
  created_at TIMESTAMP NOT NULL OPTIONS (allow_commit_timestamp = true),
) PRIMARY KEY (tenant_id, id);

-- Edge table (one generic edge table for all 72 typed relationships)
CREATE TABLE Edges (
  tenant_id STRING(64) NOT NULL,
  situation_id STRING(64) NOT NULL,
  source_id STRING(64) NOT NULL,
  target_id STRING(64) NOT NULL,
  source_type STRING(32) NOT NULL,
  target_type STRING(32) NOT NULL,
  relation_type STRING(64) NOT NULL,
  weight FLOAT64,
  properties JSON,
  created_at TIMESTAMP NOT NULL OPTIONS (allow_commit_timestamp = true),
) PRIMARY KEY (tenant_id, source_id, target_id, relation_type);

-- Property graph definition (ISO GQL)
CREATE PROPERTY GRAPH praxis_graph
  NODE TABLES (
    Actors KEY (tenant_id, id) LABEL Actor PROPERTIES (id, tenant_id, situation_id, label, actor_type, properties, created_at),
    Claims KEY (tenant_id, id) LABEL Claim PROPERTIES (id, tenant_id, situation_id, label, properties, created_at),
    Interests KEY (tenant_id, id) LABEL Interest PROPERTIES (id, tenant_id, situation_id, label, properties, created_at),
    Constraints KEY (tenant_id, id) LABEL Constraint PROPERTIES (id, tenant_id, situation_id, label, properties, created_at),
    Leverages KEY (tenant_id, id) LABEL Leverage PROPERTIES (id, tenant_id, situation_id, label, properties, created_at),
    Commitments KEY (tenant_id, id) LABEL Commitment PROPERTIES (id, tenant_id, situation_id, label, properties, created_at),
    Events KEY (tenant_id, id) LABEL Event PROPERTIES (id, tenant_id, situation_id, label, properties, created_at),
    Narratives KEY (tenant_id, id) LABEL Narrative PROPERTIES (id, tenant_id, situation_id, label, properties, created_at)
  )
  EDGE TABLES (
    Edges
      SOURCE KEY (tenant_id, source_id) REFERENCES Actors (tenant_id, id)
      DESTINATION KEY (tenant_id, target_id) REFERENCES Actors (tenant_id, id)
      LABEL Edge
      PROPERTIES (relation_type, weight, properties)
  );
