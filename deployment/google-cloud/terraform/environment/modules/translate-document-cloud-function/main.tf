locals {
  source_archive_object_with_md5hash = "${trimsuffix(var.source_archive_object, ".zip")}-${data.google_storage_bucket_object.source_archive_object.md5hash}.zip"

  target_language_codes = [
    "en",
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
    command = "gcloud storage cp gs://${var.source_archive_bucket}/${var.source_archive_object} ${google_storage_bucket.source_archive_bucket_md5hash.url}/${local.source_archive_object_with_md5hash} --quiet"
  }
  triggers = {
    md5hash = data.google_storage_bucket_object.source_archive_object.md5hash
  }
}

# Document Translations GCS Bucket
resource "google_storage_bucket" "document_translations" {
  name          = "document-translations-${data.google_project.project.project_id}"
  location      = var.region
  force_destroy = true

  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }
}

resource "google_cloudfunctions2_function" "translate_document" {
  provider    = google-beta
  name        = "translate-document"
  location    = var.region
  description = "Translates a document"

  event_trigger {
    trigger_region = var.region
    event_type     = "google.cloud.storage.object.v1.finalized"
    retry_policy   = "RETRY_POLICY_DO_NOT_RETRY"
    event_filters {
      attribute = "bucket"
      value     = google_storage_bucket.document_translations.name
    }
  }

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
