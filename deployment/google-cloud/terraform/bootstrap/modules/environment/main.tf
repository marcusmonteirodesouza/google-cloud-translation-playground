locals {
  cloudbuild_sa_email = "${data.google_project.environment.number}@cloudbuild.gserviceaccount.com"

  cloudbuild_sa_roles = [
    "roles/cloudfunctions.admin",
    "roles/eventarc.admin",
    "roles/iam.serviceAccountUser",
  ]

  compute_sa_email = "${data.google_project.environment.number}-compute@developer.gserviceaccount.com"

  compute_sa_roles = [
  ]

  gcs_sa_email = "service-${data.google_project.environment.number}@gs-project-accounts.iam.gserviceaccount.com"

  gcs_sa_roles = [
    "roles/pubsub.publisher"
  ]

  server_image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.server.repository_id}/server"

  cloud_function_buckets = {
    "translate-document" : "translate-document-cloud-function-${random_id.random.hex}",
  }
}

data "google_project" "environment" {
  project_id = var.project_id
}

data "google_sourcerepo_repository" "repo" {
  project = var.project_id
  name    = var.sourcerepo_name
}

resource "random_id" "random" {
  byte_length = 4
}

# Push to branch
resource "google_cloudbuild_trigger" "push_to_branch_deployment" {
  project     = var.project_id
  name        = "push-to-branch-deployment"
  description = "Deployment Pipeline - Cloud Source Repository Trigger ${data.google_sourcerepo_repository.repo.name} push to ${var.branch_name}"

  trigger_template {
    repo_name   = data.google_sourcerepo_repository.repo.name
    branch_name = var.branch_name
  }

  filename = "deployment/google-cloud/cloudbuild.yaml"

  substitutions = {
    _TFSTATE_BUCKET                                          = var.tfstate_bucket
    _REGION                                                  = var.region
    _SERVER_IMAGE                                       = local.server_image
    _TRANSLATE_DOCUMENT_CLOUD_FUNCTION_SOURCE_ARCHIVE_BUCKET = local.cloud_function_buckets["translate-document"]
  }
}

# Cloud Build Service Account roles and permissions
resource "google_project_iam_member" "cloudbuild_sa" {
  for_each = toset(local.cloudbuild_sa_roles)
  project  = var.project_id
  role     = each.value
  member   = "serviceAccount:${local.cloudbuild_sa_email}"
}

# Default Compute Service Account roles and permissions
resource "google_project_iam_member" "compute_sa" {
  for_each = toset(local.compute_sa_roles)
  project  = var.project_id
  role     = each.value
  member   = "serviceAccount:${local.compute_sa_email}"
}

# Google Cloud Storage Service Account roles and permissions
resource "google_project_iam_member" "gcs_sa" {
  for_each = toset(local.gcs_sa_roles)
  project  = var.project_id
  role     = each.value
  member   = "serviceAccount:${local.gcs_sa_email}"
}

# Only a project's Owner can create App Engine applications https://cloud.google.com/appengine/docs/standard/python/roles#primitive_roles
resource "google_app_engine_application" "firestore" {
  project       = var.project_id
  location_id   = var.region
  database_type = "CLOUD_FIRESTORE"
}

# Server
resource "google_artifact_registry_repository" "server" {
  project       = var.project_id
  location      = var.region
  repository_id = "server"
  format        = "DOCKER"
}


# Cloud Function Buckets
resource "google_storage_bucket" "cloud_functions" {
  for_each      = local.cloud_function_buckets
  project       = var.project_id
  name          = each.value
  location      = var.region
  force_destroy = true

  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }
}

resource "google_storage_bucket_iam_member" "cloudbuild_sa_cloud_functions_storage_admin" {
  for_each = local.cloud_function_buckets
  bucket   = each.value
  role     = "roles/storage.admin"
  member   = "serviceAccount:${local.cloudbuild_sa_email}"

  depends_on = [
    google_storage_bucket.cloud_functions
  ]
}

# Cloud Build Community Builders
resource "null_resource" "submit_community_builders" {
  provisioner "local-exec" {
    command     = "./submit-community-builders.sh ${var.project_id}"
    working_dir = "${path.module}/scripts"
  }
}