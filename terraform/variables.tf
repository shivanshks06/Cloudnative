variable "my_ip" {
  description = "Your public IP address for SSH access"
  type        = string
}

variable "backup_bucket_name" {
  type        = string
  description = "S3 bucket for CloudNative PostgreSQL backups"
}
