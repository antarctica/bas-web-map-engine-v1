#
# Defines provisioning tasks for resources created by Terraform
# Typically these are limited to configuring resources to a common 'foundation' state to mask provider differences

# This resource implicitly depends on the 'aws_instance.webmap-engine-prod-node1' resource
# This resource implicitly depends on the 'aws_route53_record.webmap-engine-prod-node1-ext' resource
resource "null_resource" "ansible-galaxy" {
  triggers {
    webmap-engine_prod_node1_instance_id = "${aws_instance.webmap-engine-prod-node1.id}"
    webmap-engine_prod_node1_dns_fqdn = "${aws_route53_record.webmap-engine-prod-node1-ext.fqdn}"
  }

  provisioner "local-exec" {
    command = "ansible-galaxy install --role-file=../galaxy.yml --roles-path=../roles --force"
  }
}

# This resource explicitly depends on the 'null_resource.ansible-terraform-foundation' resource
# This resource implicitly depends on the 'aws_instance.webmap-engine-prod-node1' resource
# This resource implicitly depends on the 'aws_route53_record.webmap-engine-prod-node1-ext' resource
resource "null_resource" "ansible-terraform-foundation" {
  depends_on = ["null_resource.ansible-galaxy"]

  triggers {
    webmap-engine_prod_node1_instance_id = "${aws_instance.webmap-engine-prod-node1.id}"
    webmap-engine_prod_node1_dns_fqdn = "${aws_route53_record.webmap-engine-prod-node1-ext.fqdn}"
  }

  provisioner "local-exec" {
    command = "ansible-playbook -i ../inventories/terraform-dynamic-inventory 25-terraform-foundation.yml"
  }
}
