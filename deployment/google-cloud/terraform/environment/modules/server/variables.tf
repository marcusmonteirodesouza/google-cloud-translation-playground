variable "region" {
  type        = string
  description = "The default GCP region for the created resources."
}

variable "server_image" {
  type        = string
  description = "The server container image name."
}

variable "translate_documents_gcs_bucket" {
  type        = string
  description = "The GCS bucket in which documents to be translated are uploaded to."
}

variable "translated_documents_gcs_bucket" {
  type        = string
  description = "The GCS bucket in which translated documents are uploaded to."
}