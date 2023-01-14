output "project_id" {
  value = google_project.project.project_id
}

output "tfstate_bucket" {
  value = google_storage_bucket.tfstate.name
}