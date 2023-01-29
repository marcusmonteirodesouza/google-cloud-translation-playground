module "project" {
  source = "./modules/project"

  project_id      = var.project_id
  folder_id       = var.folder_id
  billing_account = var.billing_account
  region          = var.region
}

resource "google_secret_manager_secret" "tfvars" {
  project   = module.project.project_id
  secret_id = "terraform-tfvars"

  replication {
    user_managed {
      replicas {
        location = var.region
      }
    }
  }
}

resource "google_secret_manager_secret_version" "tfvars" {
  secret      = google_secret_manager_secret.tfvars.id
  secret_data = file("${path.module}/terraform.tfvars")
}

module "environment" {
  source = "./modules/environment"

  project_id      = module.project.project_id
  region          = var.region
  domain          = var.domain
  sourcerepo_name = var.sourcerepo_name
  branch_name     = var.branch_name
  tfstate_bucket  = module.project.tfstate_bucket
}