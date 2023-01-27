data "google_project" "project" {
}

# Cloud Run Service
resource "google_cloud_run_service" "server" {
  name     = "server"
  location = var.region

  template {
    spec {
      containers {
        image = var.server_image

        env {
          name  = "PROJECT_ID"
          value = data.google_project.project.project_id
        }
        env {
          name  = "GCS_API_ENDPOINT"
          value = "storage.googleapis.com"
        }
        env {
          name  = "TRANSLATE_DOCUMENTS_GCS_BUCKET"
          value = var.translate_documents_gcs_bucket
        }
        env {
          name  = "TRANSLATED_DOCUMENTS_GCS_BUCKET"
          value = var.translated_documents_gcs_bucket
        }
      }
    }
  }

  # TODO(Marcus): Uncomment when implementing the Load Balancer
  # metadata {
  #   annotations = {
  #     "run.googleapis.com/ingress" = "internal-and-cloud-load-balancing"
  #   }
  # }
}

resource "google_cloud_run_service_iam_member" "allow_unauthenticated" {
  location = google_cloud_run_service.server.location
  project  = google_cloud_run_service.server.project
  service  = google_cloud_run_service.server.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}