locals {
  cloudbuild_sa_email = "${data.google_project.project.number}@cloudbuild.gserviceaccount.com"

  cloudbuild_sa_roles = [
    "roles/cloudfunctions.admin",
    "roles/compute.loadBalancerAdmin",
    "roles/compute.viewer",
    "roles/eventarc.admin",
    "roles/iam.serviceAccountUser",
    "roles/storage.admin"
  ]

  compute_sa_email = "${data.google_project.project.number}-compute@developer.gserviceaccount.com"

  compute_sa_roles = [
    "roles/datastore.user",
    "roles/storage.admin"
  ]

  gcs_sa_email = "service-${data.google_project.project.number}@gs-project-accounts.iam.gserviceaccount.com"

  gcs_sa_roles = [
    "roles/pubsub.publisher"
  ]

  cloudrun_service_agent_email = "service-${data.google_project.project.number}@serverless-robot-prod.iam.gserviceaccount.com"

  local_testing_roles = [
    "roles/cloudtranslate.user",
    "roles/datastore.user",
    "roles/storage.admin"
  ]

  server_image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.server.repository_id}/server"

  cloud_function_buckets = {
    "translate-document" : "translate-document-cloud-function-${random_id.random.hex}",
  }
}

data "google_project" "project" {
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
    _DOMAIN                                                  = var.domain
    _SERVER_IMAGE                                            = local.server_image
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

# Cloud Run Service Agent roles and permissions
resource "google_artifact_registry_repository_iam_member" "cloudrun_service_agent_server" {
  project    = google_artifact_registry_repository.server.project
  location   = google_artifact_registry_repository.server.location
  repository = google_artifact_registry_repository.server.name
  role       = "roles/artifactregistry.reader"
  member     = "serviceAccount:${local.cloudrun_service_agent_email}"
}

# Local testing Service Account roles and permissions
resource "google_service_account" "local_testing" {
  project      = var.project_id
  account_id   = "local-testing"
  display_name = "Has the roles and permissions required for locally test the applications."
}

resource "google_project_iam_member" "local_testing" {
  for_each = toset(local.local_testing_roles)
  project  = var.project_id
  role     = each.value
  member   = "serviceAccount:${google_service_account.local_testing.email}"
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