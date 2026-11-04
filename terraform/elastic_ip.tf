resource "aws_eip" "cloudnative" {
  domain = "vpc"

  tags = {
    Name = "cloudnative-eip"
  }
}

resource "aws_eip_association" "cloudnative" {
  instance_id   = aws_instance.cloudnative_server.id
  allocation_id = aws_eip.cloudnative.id
}

