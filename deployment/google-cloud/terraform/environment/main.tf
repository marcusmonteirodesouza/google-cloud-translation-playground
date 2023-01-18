module "translate_document_cloud_function" {
  source                   = "./modules/translate-document-cloud-function"
  region                   = var.region
  source_archive_bucket    = var.add_collaborator_cloud_function_source_archive_bucket
  source_archive_object    = var.add_collaborator_cloud_function_source_archive_object
  environments_repo_url    = var.repo_url
  environments_branch_name = var.branch_name
}