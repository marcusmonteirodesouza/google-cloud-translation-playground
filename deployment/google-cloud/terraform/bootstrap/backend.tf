terraform {
  backend "gcs" {
    bucket = "humbly-largely-credible-escargot"
    prefix = "bootstrap"
  }
}
