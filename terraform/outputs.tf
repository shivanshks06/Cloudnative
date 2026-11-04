output "ec2_public_ip" {
  description = "Public IP of CloudNative EC2"
  value       = aws_instance.cloudnative_server.public_ip
}

output "ec2_public_dns" {
  description = "Public DNS of CloudNative EC2"
  value       = aws_instance.cloudnative_server.public_dns
}

output "ec2_instance_id" {
  description = "CloudNative EC2 instance ID"
  value       = aws_instance.cloudnative_server.id
}

output "ssh_connection_command" {
  description = "Command to SSH into CloudNative EC2"
  value       = "ssh -i ~/.ssh/cloudnative-ec2 ubuntu@${aws_instance.cloudnative_server.public_ip}"
}

output "app_url" {
  description = "CloudNative Web App URL"
  value       = "http://${aws_instance.cloudnative_server.public_ip}"
}
