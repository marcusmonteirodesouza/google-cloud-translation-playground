terraform {
  backend "gcs" {
    bucket = "rationally-deadly-accurate-duck"
    prefix = "bootstrap"
  }
}
