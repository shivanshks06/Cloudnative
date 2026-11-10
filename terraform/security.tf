resource "aws_security_group" "cloudnative_sg" {
  name        = "cloudnative-security-group"
  description = "Security group for CloudNative EC2"
  vpc_id      = aws_vpc.cloudnative_vpc.id

  # HTTP - Public web traffic
  ingress {
    description = "HTTP access"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS - Public SSL traffic
  ingress {
    description = "HTTPS access"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "cloudnative-security-group"
  }
}
