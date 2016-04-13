#
# This file relies on the AWS Terraform provider being previously configured - see '00-providers.tf'
# This file relies on a remote state resource being previously configured for shared outputs - see '01-remote-state.tf'

# Define using environment variable - e.g. TF_VAR_aws_ssh_key=XXX
# If you require a key pair to be registered please contact the BAS Web & Applications Team.
#
# AWS Source: http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-key-pairs.html
variable "aws_ssh_key" {}

# Represents the latest version of the antarctica/centos7 AWS AIM
#
# Atlas source: https://atlas.hashicorp.com/antarctica/artifacts/centos7/types/amazon.ami
# Terraform source: https://www.terraform.io/docs/providers/atlas/r/artifact.html
resource "atlas_artifact" "antarctica-centos7-latest" {
  name = "antarctica/centos7"
  type = "amazon.ami"
  version = "latest"
}

# Generic virtual machine 1 - Accessible worldwide
#
# This resource implicitly depends on the 'atlas_artifact.antarctica-centos7-latest' resource
# This resource implicitly depends on outputs from the the 'terraform_remote_state.BAS-AWS' resource
#
# AWS source: https://aws.amazon.com/ec2/
# Terraform source: https://www.terraform.io/docs/providers/aws/r/instance.html
resource "aws_instance" "webmap-engine-prod-node1" {
    instance_type = "t2.nano"
    ami = "${atlas_artifact.antarctica-centos7-latest.metadata_full.region-eu-west-1}"
    key_name = "${var.aws_ssh_key}"

    subnet_id = "${terraform_remote_state.BAS-AWS.output.BAS-VPC-2-External-Subnet-ID}"
    vpc_security_group_ids = [
        "${terraform_remote_state.BAS-AWS.output.BAS-VPC-2-SG-All-Egress-ID}",
        "${terraform_remote_state.BAS-AWS.output.BAS-VPC-2-SG-Ping-ID}",
        "${terraform_remote_state.BAS-AWS.output.BAS-VPC-2-SG-SSH-BAS-ID}"
    ]

    tags {
        Name = "webmap-engine-prod-node1"
        X-Project = "BAS WebMap Engine"
        X-Purpose = "Node"
        X-Subnet = "External"
        X-Managed-By = "Terraform"
    }
}

# This resource implicitly depends on the 'aws_instance.webmap-engine-prod-node1' resource
#
# AWS source: http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/elastic-ip-addresses-eip.html#VPC_EIPConcepts
# Terraform source: https://www.terraform.io/docs/providers/aws/r/eip.html
#
# Tags are not supported by this resource
resource "aws_eip" "webmap-engine-prod-node1" {
    instance = "${aws_instance.webmap-engine-prod-node1.id}"
    vpc = true
}

# This resource implicitly depends on the 'aws_eip.webmap-engine-prod-node1' resource
# This resource implicitly depends on outputs from the the 'terraform_remote_state.BAS-AWS' resource
#
# AWS source: http://docs.aws.amazon.com/Route53/latest/DeveloperGuide/rrsets-working-with.html
# Terraform source: https://www.terraform.io/docs/providers/aws/r/route53_record.html
#
# Tags are not supported by this resource
resource "aws_route53_record" "webmap-engine-prod-node1-ext" {
    zone_id = "${terraform_remote_state.BAS-AWS.output.BAS-AWS-External-Subdomain-ID}"

    name = "webmap-engine-prod-node1"
    type = "A"
    ttl = "300"
    records = [
        "${aws_eip.webmap-engine-prod-node1.public_ip}"
    ]
}

# This resource implicitly depends on the 'aws_eip.webmap-engine-prod-node1' resource
# This resource implicitly depends on outputs from the the 'terraform_remote_state.BAS-AWS' resource
#
# AWS source: http://docs.aws.amazon.com/Route53/latest/DeveloperGuide/rrsets-working-with.html
# Terraform source: https://www.terraform.io/docs/providers/aws/r/route53_record.html
#
# Tags are not supported by this resource
resource "aws_route53_record" "webmap-engine-prod-node1-int" {
    zone_id = "${terraform_remote_state.BAS-AWS.output.BAS-AWS-Internal-Subdomain-ID}"

    name = "webmap-engine-prod-node1"
    type = "A"
    ttl = "300"
    records = [
        "${aws_eip.webmap-engine-prod-node1.private_ip}"
    ]
}
