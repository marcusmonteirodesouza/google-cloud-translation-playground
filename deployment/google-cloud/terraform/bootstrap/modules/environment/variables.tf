variable "project_id" {
  type        = string
  description = "The project ID."
}

variable "region" {
  type        = string
  description = "The default region in which resources will be created."
}

variable "domain" {
  type        = string
  description = "You application's domain name."
}

variable "sourcerepo_name" {
  type        = string
  description = "The Cloud Source Repository name."
}

variable "branch_name" {
  type        = string
  description = "The Cloud Source repository branch name."
}

variable "tfstate_bucket" {
  type        = string
  description = "The GCS bucket to store the project's terraform state."
}