locals {
  cloudbuild_sa_email = "${data.google_project.environment.number}@cloudbuild.gserviceaccount.com"

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
    _TRANSLATE_DOCUMENT_CLOUD_FUNCTION_SOURCE_ARCHIVE_BUCKET = local.cloud_function_buckets["translate-document"]
  }
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