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
          name  = "NODE_ENV"
          value = "production"
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
}

resource "google_cloud_run_service_iam_member" "allow_unauthenticated" {
  location = google_cloud_run_service.server.location
  project  = google_cloud_run_service.server.project
  service  = google_cloud_run_service.server.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_compute_region_network_endpoint_group" "serverless_neg" {
  provider              = google-beta
  name                  = "server-neg"
  region                = var.region
  network_endpoint_type = "SERVERLESS"
  cloud_run {
    service = google_cloud_run_service.server.name
  }
}

module "https_lb" {
  source         = "GoogleCloudPlatform/lb-http/google//modules/serverless_negs"
  version        = "~> 6.2.0"
  name           = "server-https-lb"
  project        = data.google_project.project.project_id
  address        = var.https_lb_ip_address
  create_address = false

  ssl                             = true
  managed_ssl_certificate_domains = [var.domain]
  https_redirect                  = true

  backends = {
    default = {
      description = null
      groups = [
        {
          group = google_compute_region_network_endpoint_group.serverless_neg.id
        }
      ]
      enable_cdn              = false
      security_policy         = null
      custom_request_headers  = null
      custom_response_headers = null

      iap_config = {
        enable               = false
        oauth2_client_id     = null
        oauth2_client_secret = null
      }

      log_config = {
        enable      = false
        sample_rate = null
      }
    }
  }
}