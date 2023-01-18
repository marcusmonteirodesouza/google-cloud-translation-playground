module "translate_document_cloud_function" {
  source                = "./modules/translate-document-cloud-function"
  region                = var.region
  source_archive_bucket = var.translate_document_cloud_function_source_archive_bucket
  source_archive_object = var.translate_document_cloud_function_source_archive_object
}