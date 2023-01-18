# Deployment

## Google Cloud

### Pre-Requisites

1. Install `terraform`.
1. Install the `gcloud` CLI.

### Bootstrap

1. Run `gcloud auth login`
1. Run `gcloud auth application-default login`.
1. `cd` into the [deployment/google-cloud/terraform/bootstrap](./deployment/google-cloud/terraform/bootstrap) folder.
1. Comment out the entire contents of the [deployment/google-cloud/terraform/bootstrap/backend.tf](deployment/google-cloud/terraform/bootstrap/backend.tf) file.
1. Create a [`terraform.tfvars`](https://developer.hashicorp.com/terraform/language/values/variables#variable-definitions-tfvars-files) file and add your variables' values. Leave the `sourcerepo_name` empty for now.
1. Run `terraform init`.
1. Run `terraform apply -target=module.project`.
1. Uncomment the [deployment/google-cloud/terraform/bootstrap/backend.tf](deployment/google-cloud/terraform/bootstrap/backend.tf) file's contents and add the value of the `tfstate_bucket` output as the value of the `bucket` attribute.
1. Run `terraform init` and answer `yes`.
1. [Create a Cloud Source Repository](https://cloud.google.com/source-repositories/docs/creating-an-empty-repository#gcloud) in the project your just created. Optionally create it mirroring your [Github](https://cloud.google.com/source-repositories/docs/mirroring-a-github-repository) or your [Bitbucket](https://cloud.google.com/source-repositories/docs/mirroring-a-bitbucket-repository) repository. Update the `sourcerepo_name` variable with the repository name.
1. Run `terraform apply`.

### Deployment

1. Push a commit to your Cloud Source Repository or to your other hosting platform if you created the repository by mirroring.
