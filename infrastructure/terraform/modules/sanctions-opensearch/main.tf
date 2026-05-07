variable "project_id" { type = string }
variable "region" { type = string }

# Placeholder module for the managed OpenSearch deployment selected at
# procurement time. The yente service only depends on a URL, so PRAXIS can use
# Elastic Cloud, OpenSearch Serverless, or a private GCE deployment without
# changing application code.
output "deployment_note" {
  value = "Provision managed OpenSearch separately and pass its private URL to sanctions-yente."
}
