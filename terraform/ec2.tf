# Register SSH public key with AWS
resource "aws_key_pair" "cloudnative_key" {
  key_name   = "cloudnative-ec2-key"
  public_key = file(pathexpand("~/.ssh/cloudnative-ec2.pub"))

  tags = {
    Name = "cloudnative-ec2-key"
  }
}

# Find the latest Ubuntu 24.04 AMI
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}
