variable "project_id" { type = string }
variable "region" { type = string }
variable "image" { type = string }
variable "service_account" { type = string }

resource "google_cloud_run_v2_service" "extract_ner_gliner" {
  name     = "extract-ner-gliner"
  location = var.region
  project  = var.project_id
  ingress  = "INGRESS_TRAFFIC_INTERNAL_ONLY"

  template {
    service_account = var.service_account
    timeout         = "120s"
    max_instance_request_concurrency = 8

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
  value = google_cloud_run_v2_service.extract_ner_gliner.uri
}
