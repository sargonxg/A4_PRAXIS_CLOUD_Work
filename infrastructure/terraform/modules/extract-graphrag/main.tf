variable "project_id" { type = string }
variable "region" { type = string }
variable "image" { type = string }
variable "service_account" { type = string }

resource "google_cloud_run_v2_service" "extract_graphrag" {
  name     = "extract-graphrag"
  location = var.region
  project  = var.project_id
  ingress  = "INGRESS_TRAFFIC_INTERNAL_ONLY"

  template {
    service_account = var.service_account
    timeout         = "900s"
    max_instance_request_concurrency = 1

    containers {
      image = var.image
      resources {
        limits = {
          cpu    = "4"
          memory = "8Gi"
        }
      }
    }
  }
}

output "url" {
  value = google_cloud_run_v2_service.extract_graphrag.uri
}
