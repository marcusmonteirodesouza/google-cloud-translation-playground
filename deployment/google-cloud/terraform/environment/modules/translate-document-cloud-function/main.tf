locals {
  source_archive_object_with_md5hash = "${trimsuffix(var.source_archive_object, ".zip")}-${data.google_storage_bucket_object.source_archive_object.md5hash}.zip"

  target_language_codes = [
    "fr"
  ]
}

data "google_project" "project" {
}

data "google_storage_bucket_object" "source_archive_object" {
  name   = var.source_archive_object
  bucket = var.source_archive_bucket
}
resource "google_storage_bucket" "source_archive_bucket_md5hash" {
  name                        = "${var.source_archive_bucket}-md5hash"
  location                    = var.region
  force_destroy               = true
  uniform_bucket_level_access = true
  versioning {
    enabled = true
  }
}
resource "null_resource" "copy_source_archive_object" {
  provisioner "local-exec" {
    command = "gcloud alpha storage cp gs://${var.source_archive_bucket}/${var.source_archive_object} ${google_storage_bucket.source_archive_bucket_md5hash.url}/${local.source_archive_object_with_md5hash} --quiet"
  }
  triggers = {
    md5hash = data.google_storage_bucket_object.source_archive_object.md5hash
  }
}
resource "google_cloudfunctions2_function" "send_email_ses" {
  provider    = google-beta
  name        = "translate-document"
  location    = var.region
  description = "Translates a document"

  build_config {
    runtime     = "nodejs16"
    entry_point = "translateDocument"
    source {
      storage_source {
        bucket = google_storage_bucket.source_archive_bucket_md5hash.name
        object = local.source_archive_object_with_md5hash
      }
    }
  }

  service_config {
    max_instance_count = 100
    available_memory   = "256M"
    timeout_seconds    = 60

    environment_variables = {
      PROJECT_ID            = data.google_project.project.project_id
      TARGET_LANGUAGE_CODES = join(",", local.target_language_codes)
    }
  }

  depends_on = [
    null_resource.copy_source_archive_object
  ]
}
