variable "project_id" { type = string }
variable "region" { type = string }
variable "image" { type = string }
variable "service_account" { type = string }
variable "yente_index_url" { type = string }

resource "google_cloud_run_v2_service" "sanctions_yente" {
  name     = "sanctions-yente"
  location = var.region
  project  = var.project_id
  ingress  = "INGRESS_TRAFFIC_INTERNAL_ONLY"

  template {
    service_account = var.service_account
    timeout         = "120s"
    max_instance_request_concurrency = 16

    containers {
      image = var.image
      env {
        name  = "YENTE_INDEX_URL"
        value = var.yente_index_url
      }
      resources {
        limits = {
          cpu    = "2"
          memory = "4Gi"
        }
      }
    }
  }
}

output "url" {
  value = google_cloud_run_v2_service.sanctions_yente.uri
}
