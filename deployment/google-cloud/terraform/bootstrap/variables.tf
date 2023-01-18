

variable "project_id" {
  type        = string
  description = "The project ID."
}

variable "folder_id" {
  type        = string
  description = "The numeric ID of the folder this project should be created under."
}

variable "billing_account" {
  type        = string
  description = "The alphanumeric ID of the billing account this project belongs to."
}

variable "region" {
  type        = string
  description = "The default region in which resources will be created."
}

variable "target_language_codes" {
  type        = list(string)
  description = "The codes of the target languages to which documents will be translated to. See https://cloud.google.com/translate/docs/languages."
}

variable "sourcerepo_name" {
  type        = string
  description = "The Cloud Source Repository name."
}

variable "branch_name" {
  type        = string
  description = "The Cloud Source repository branch name."
}