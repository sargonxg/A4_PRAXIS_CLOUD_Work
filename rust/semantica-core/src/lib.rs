use serde::{Deserialize, Serialize};
use std::collections::HashSet;

pub const PRAXIS_SEMANTICA_SCHEMA: &str = "praxis-semantica-context-core.v1";
pub const MAX_NODES: usize = 80;
pub const MAX_EDGES: usize = 160;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ContextGraph {
    pub schema_version: String,
    pub context_core_id: String,
    #[serde(default)]
    pub entities: Vec<Entity>,
    #[serde(default)]
    pub relationships: Vec<Relationship>,
}

#[derive(Debug, Deserialize)]
pub struct Entity {
    pub id: String,
    #[serde(rename = "type")]
    pub entity_type: String,
    pub label: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Relationship {
    pub id: String,
    pub source_id: String,
    pub target_id: String,
    #[serde(rename = "type")]
    pub relationship_type: String,
}

#[derive(Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GraphValidation {
    pub node_count: usize,
    pub edge_count: usize,
    pub has_context_root: bool,
    pub has_domain_ontology: bool,
    pub has_work_ontology: bool,
    pub orphan_edge_count: usize,
    pub semantica_ready: bool,
}

impl GraphValidation {
    pub fn semantica_ready(&self) -> bool {
        self.semantica_ready
    }
}

pub fn validate_context_graph_json(input: &str) -> Result<GraphValidation, String> {
    let graph: ContextGraph = serde_json::from_str(input).map_err(|err| err.to_string())?;
    validate_context_graph(&graph)
}

pub fn validate_context_graph(graph: &ContextGraph) -> Result<GraphValidation, String> {
    if graph.schema_version != PRAXIS_SEMANTICA_SCHEMA {
        return Err(format!("unsupported schemaVersion: {}", graph.schema_version));
    }
    if graph.context_core_id.trim().is_empty() {
        return Err("contextCoreId is required".to_string());
    }
    if graph.entities.is_empty() {
        return Err("at least one entity is required".to_string());
    }
    if graph.entities.len() > MAX_NODES {
        return Err(format!("too many entities: {}", graph.entities.len()));
    }
    if graph.relationships.len() > MAX_EDGES {
        return Err(format!("too many relationships: {}", graph.relationships.len()));
    }

    let ids: HashSet<&str> = graph.entities.iter().map(|entity| entity.id.as_str()).collect();
    if ids.len() != graph.entities.len() {
        return Err("entity ids must be unique".to_string());
    }

    let orphan_edge_count = graph
        .relationships
        .iter()
        .filter(|edge| !ids.contains(edge.source_id.as_str()) || !ids.contains(edge.target_id.as_str()))
        .count();

    let has_context_root = graph.entities.iter().any(|entity| entity.entity_type == "context_core");
    let has_domain_ontology = graph.entities.iter().any(|entity| entity.entity_type == "domain_ontology");
    let has_work_ontology = graph.entities.iter().any(|entity| entity.entity_type == "work_ontology");

    Ok(GraphValidation {
        node_count: graph.entities.len(),
        edge_count: graph.relationships.len(),
        has_context_root,
        has_domain_ontology,
        has_work_ontology,
        orphan_edge_count,
        semantica_ready: has_context_root && has_domain_ontology && has_work_ontology && orphan_edge_count == 0,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_a_ready_context_graph() {
        let graph = r#"{
          "schemaVersion": "praxis-semantica-context-core.v1",
          "contextCoreId": "context-core:test",
          "entities": [
            { "id": "context-core:test", "type": "context_core", "label": "Test" },
            { "id": "domain-ontology:conflict", "type": "domain_ontology", "label": "Conflict" },
            { "id": "work-ontology:policy", "type": "work_ontology", "label": "Policy" }
          ],
          "relationships": [
            { "id": "e1", "sourceId": "context-core:test", "targetId": "domain-ontology:conflict", "type": "has_domain_ontology" },
            { "id": "e2", "sourceId": "context-core:test", "targetId": "work-ontology:policy", "type": "has_work_ontology" }
          ]
        }"#;

        let validation = validate_context_graph_json(graph).expect("graph should validate");
        assert!(validation.semantica_ready());
        assert_eq!(validation.node_count, 3);
        assert_eq!(validation.edge_count, 2);
    }

    #[test]
    fn rejects_orphan_relationships_as_not_ready() {
        let graph = r#"{
          "schemaVersion": "praxis-semantica-context-core.v1",
          "contextCoreId": "context-core:test",
          "entities": [
            { "id": "context-core:test", "type": "context_core", "label": "Test" },
            { "id": "domain-ontology:conflict", "type": "domain_ontology", "label": "Conflict" },
            { "id": "work-ontology:policy", "type": "work_ontology", "label": "Policy" }
          ],
          "relationships": [
            { "id": "e1", "sourceId": "context-core:test", "targetId": "missing", "type": "has_domain_ontology" }
          ]
        }"#;

        let validation = validate_context_graph_json(graph).expect("shape should parse");
        assert!(!validation.semantica_ready());
        assert_eq!(validation.orphan_edge_count, 1);
    }
}
