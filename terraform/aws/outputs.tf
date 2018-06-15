output "public_ips_supervisor_peer" {
  value = "${aws_instance.initial-peer.public_ip}"
}

output "public_ips_mysql" {
  value = "${aws_instance.mysql.*.public_ip}"
}

output "public_ips_nodeapp" {
  value = "${aws_instance.nodeapp.public_ip}"
}
