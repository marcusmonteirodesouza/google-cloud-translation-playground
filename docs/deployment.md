# Deployment

## Google Cloud

### Pre-Requisites

1. Install `terraform`.
1. Install the `gcloud` CLI.

### Bootstrap

1. Run `gcloud auth login` 
1. Run `gcloud auth application-default login`.
1. Comment out the entire content of the [deployment/google-cloud/terraform/bootstrap/backend.tf](deployment/google-cloud/terraform/bootstrap/backend.tf) file.
1. Run `terraform init`.
1. Run `terraform apply -target=module.project`.
1. Uncomment the [deployment/google-cloud/terraform/bootstrap/backend.tf](deployment/google-cloud/terraform/bootstrap/backend.tf) file's contents and add the value of the `tfstate_bucket` output as the value of the `bucket` attribute.
1. Run `terraform init` and answer `yes`.
1. Run `terraform apply`.