provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

# GCS Buckets
resource "google_storage_bucket" "translate_documents" {
  name          = "translate-documents-${var.project_id}"
  location      = var.region
  force_destroy = true

  uniform_bucket_level_access = true
}

resource "google_storage_bucket" "translated_documents" {
  name          = "translated-documents-${var.project_id}"
  location      = var.region
  force_destroy = true

  uniform_bucket_level_access = true
}

# Server
resource "google_compute_global_address" "server_https_lb" {
  name = "server-https-lb-address"
}

module "server" {
  source                          = "./modules/server"
  region                          = var.region
  https_lb_ip_address             = join("", google_compute_global_address.server_https_lb.*.address)
  domain                          = var.domain
  server_image                    = var.server_image
  translate_documents_gcs_bucket  = google_storage_bucket.translate_documents.name
  translated_documents_gcs_bucket = google_storage_bucket.translated_documents.name
}

# Translate Document Cloud Function
module "translate_document_cloud_function" {
  source                          = "./modules/translate-document-cloud-function"
  region                          = var.region
  source_archive_bucket           = var.translate_document_cloud_function_source_archive_bucket
  source_archive_object           = var.translate_document_cloud_function_source_archive_object
  translate_documents_gcs_bucket  = google_storage_bucket.translate_documents.name
  translated_documents_gcs_bucket = google_storage_bucket.translated_documents.name
}