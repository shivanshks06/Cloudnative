output "ec2_public_ip" {
  description = "Public IP of CloudNative EC2 (Elastic IP)"
  value       = aws_eip.cloudnative.public_ip
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
  value       = "ssh -i ~/.ssh/cloudnative-ec2 ubuntu@${aws_eip.cloudnative.public_ip}"
}

output "app_url" {
  description = "CloudNative Web App URL"
  value       = "http://${aws_eip.cloudnative.public_ip}"
}

output "grafana_url" {
  description = "CloudNative Grafana URL"
  value       = "http://${aws_eip.cloudnative.public_ip}:3000"
}

output "prometheus_url" {
  description = "CloudNative Prometheus URL"
  value       = "http://${aws_eip.cloudnative.public_ip}:9090"
}

output "ssm_connection_command" {
  description = "Connect to EC2 through AWS Systems Manager"
  value       = "aws ssm start-session --target ${aws_instance.cloudnative_server.id} --region ap-south-1 --profile cloudnative"
}
