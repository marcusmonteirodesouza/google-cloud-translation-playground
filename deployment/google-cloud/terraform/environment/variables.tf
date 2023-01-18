variable "region" {
  type        = string
  description = "The default GCP region for the created resources."
}

variable "translate_document_cloud_function_source_archive_bucket" {
  type        = string
  description = "The GCS bucket containing the zip archive which contains the Translate Document Cloud Function."
}

variable "translate_document_cloud_function_source_archive_object" {
  type        = string
  description = "The source archive object (file) of the Translate Document Cloud Function in archive bucket."
}