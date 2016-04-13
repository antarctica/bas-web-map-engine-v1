#
# Define the location of remote state files defining shared outputs
#
# This allows resources shared across projects (such as networking infrastructure) to be kept in sync without needing
# manual updates and allowing scalable, centralised management.

# The BAS-AWS remote state includes VPC subnet and security group outputs for EC2 instances and Route53 Zone outputs
# for DNS records
#
# This resource requires a valid Atlas token specified as an environment variable (i.e. ATLAS_TOKEN=[Token])
#
# Atlas source: https://atlas.hashicorp.com/antarctica/environments/BAS-AWS
# Terraform source: https://www.terraform.io/docs/providers/terraform/r/remote_state.html
resource "terraform_remote_state" "BAS-AWS" {
    backend = "atlas"
    config {
        name = "antarctica/BAS-AWS"
        path = "antarctica/BAS-AWS"
    }
}
