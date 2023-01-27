locals {
  cloudrun_service_agent = "service-${data.google_project.project.number}@serverless-robot-prod.iam.gserviceaccount.com"

  server_image_split = split("/", var.server_image)

  server_image_location = split("-docker", local.server_image_split[0])[0]

  server_image_project_id = local.server_image_split[1]

  server_image_repository = local.server_image_split[2]

  server_sa_project_roles = [
    "roles/datastore.user",
  ]
}

data "google_project" "project" {
}

# Cloud Run Service Agent
resource "google_artifact_registry_repository_iam_member" "cloudrun_service_agent" {
  project    = local.server_image_project_id
  location   = local.server_image_location
  repository = local.server_image_repository
  role       = "roles/artifactregistry.reader"
  member     = "serviceAccount:${local.cloudrun_service_agent}"
}

# Cloud Run Service Account
resource "google_service_account" "server" {
  account_id   = "server-cloud-run-sa"
  display_name = "Server Cloud Run Service Account"
}

resource "google_project_iam_member" "server_sa" {
  for_each = toset(local.server_sa_project_roles)
  project  = data.google_project.project.project_id
  role     = each.value
  member   = "serviceAccount:${google_service_account.server.email}"
}

# Cloud Run Service
resource "google_cloud_run_service" "server" {
  name     = "server"
  location = var.region

  template {
    spec {
      service_account_name = google_service_account.server.email

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

  metadata {
    annotations = {
      "run.googleapis.com/ingress" = "internal-and-cloud-load-balancing"
    }
  }

  depends_on = [
    google_artifact_registry_repository_iam_member.cloudrun_service_agent,
  ]
}

resource "google_cloud_run_service_iam_member" "allow_unauthenticated" {
  location = google_cloud_run_service.server.location
  project  = google_cloud_run_service.server.project
  service  = google_cloud_run_service.server.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}