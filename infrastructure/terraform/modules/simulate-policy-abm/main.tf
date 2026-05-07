variable "project_id" { type = string }
variable "region" { type = string }
variable "image" { type = string }
variable "service_account" { type = string }

resource "google_cloud_run_v2_service" "simulate_policy_abm" {
  name     = "simulate-policy-abm"
  location = var.region
  project  = var.project_id
  ingress  = "INGRESS_TRAFFIC_INTERNAL_ONLY"

  template {
    service_account = var.service_account
    timeout         = "300s"
    max_instance_request_concurrency = 4

    containers {
      image = var.image
      resources {
        limits = {
          cpu    = "2"
          memory = "2Gi"
        }
      }
    }
  }
}

output "url" {
  value = google_cloud_run_v2_service.simulate_policy_abm.uri
}
