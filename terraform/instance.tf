resource "aws_instance" "cloudnative_server" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t3.small"
  subnet_id              = aws_subnet.cloudnative_public_subnet.id
  vpc_security_group_ids = [aws_security_group.cloudnative_sg.id]
  key_name               = aws_key_pair.cloudnative_key.key_name

  associate_public_ip_address = true

  root_block_device {
    volume_size           = 20
    volume_type           = "gp3"
    delete_on_termination = true
  }

  metadata_options {
    http_tokens = "required"
  }

  user_data = <<-EOF
    #!/bin/bash
    set -e
    apt-get update -y
    apt-get install -y ca-certificates curl gnupg docker.io docker-compose-v2 git
    systemctl enable docker
    systemctl start docker
    usermod -aG docker ubuntu
  EOF

  tags = {
    Name = "cloudnative-server"
  }
}
