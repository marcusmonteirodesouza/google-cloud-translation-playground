output "service" {
  value       = google_cloud_run_service.server.name
  description = "The Server Cloud Run service name."
}