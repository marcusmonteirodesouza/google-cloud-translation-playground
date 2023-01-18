variable "project_id" {
  type        = string
  description = "The project ID."
}

variable "region" {
  type        = string
  description = "The default GCP region for the created resources."
}

variable "target_language_codes" {
  type        = string
  description = "Comma-separated list of codes of the target languages to which documents will be translated to. See https://cloud.google.com/translate/docs/languages."
}

variable "translate_document_cloud_function_source_archive_bucket" {
  type        = string
  description = "The GCS bucket containing the zip archive which contains the Translate Document Cloud Function."
}

variable "translate_document_cloud_function_source_archive_object" {
  type        = string
  description = "The source archive object (file) of the Translate Document Cloud Function in archive bucket."
}