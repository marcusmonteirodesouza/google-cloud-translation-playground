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

variable "target_language_codes" {
  type        = list(string)
  description = "The codes of the target languages to which the document will be translated to. See https://cloud.google.com/translate/docs/languages."
}