variable "region" {
  type        = string
  description = "The default GCP region for the created resources."
}

variable "source_archive_bucket" {
  type        = string
  description = "The GCS bucket containing the zip archive which contains the function."
}

variable "source_archive_object" {
  type        = string
  description = "The source archive object (file) in archive bucket."
}

variable "translate_documents_gcs_bucket" {
  type        = string
  description = "The GCS bucket in which documents to be translated are uploaded to."
}

variable "translated_documents_gcs_bucket" {
  type        = string
  description = "The GCS bucket in which translated documents are uploaded to."
}