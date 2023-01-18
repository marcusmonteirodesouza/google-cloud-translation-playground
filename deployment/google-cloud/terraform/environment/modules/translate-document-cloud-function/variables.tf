variable "project_id" {
  type        = string
  description = "The project ID."
}

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