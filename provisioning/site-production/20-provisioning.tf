#
# Defines provisioning tasks for resources created by Terraform
# Typically these are limited to configuring resources to a common 'foundation' state to mask provider differences

# This resource implicitly depends on the 'aws_instance.webmap-engine-prod-nodes' resource
# This resource implicitly depends on the 'aws_route53_record.webmap-engine-prod-nodes-ext' resource
resource "null_resource" "ansible-galaxy" {
  triggers {
    webmap-engine_prod_nodes_instance_id = "${element(aws_instance.webmap-engine-prod-nodes.*.id, instances_count)}"
    webmap-engine_prod_nodes_dns_fqdn = "${element(aws_route53_record.webmap-engine-prod-nodes-ext.*.fqdn, instances_count)}"
  }

  provisioner "local-exec" {
    command = "ansible-galaxy install --role-file=../galaxy.yml --roles-path=../roles --force"
  }
}

# This resource explicitly depends on the 'null_resource.ansible-terraform-foundation' resource
# This resource implicitly depends on the 'aws_instance.webmap-engine-prod-nodes' resource
# This resource implicitly depends on the 'aws_route53_record.webmap-engine-prod-nodes-ext' resource
#resource "null_resource" "ansible-terraform-foundation" {
#  depends_on = ["null_resource.ansible-galaxy"]
#
#  triggers {
#    webmap-engine_prod_nodes_instance_id = "${element(aws_instance.webmap-engine-prod-nodes.*.id, instances_count)}"
#    webmap-engine_prod_nodes_dns_fqdn = "${element(aws_route53_record.webmap-engine-prod-nodes-ext.*.fqdn, instances_count)}"
#  }
#
#  provisioner "local-exec" {
#    command = "ansible-playbook -i ../inventories/terraform-dynamic-inventory 25-terraform-foundation.yml"
#  }
#}
