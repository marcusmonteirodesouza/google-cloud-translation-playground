terraform {
  backend "gcs" {
    # bucket = "" # This should be passed as -backend-config
  }
}
