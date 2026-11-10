resource "aws_instance" "cloudnative_server" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t3.small"
  subnet_id              = aws_subnet.cloudnative_public_subnet.id
  vpc_security_group_ids = [aws_security_group.cloudnative_sg.id]
  key_name               = aws_key_pair.cloudnative_key.key_name

  iam_instance_profile = aws_iam_instance_profile.cloudnative_profile.name

  associate_public_ip_address = true

  root_block_device {
    volume_size           = 20
    volume_type           = "gp3"
    delete_on_termination = true
  }

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }

  user_data = <<-EOF
    #!/bin/bash
    set -e

    apt-get update
    apt-get install -y ca-certificates curl git

    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
      -o /etc/apt/keyrings/docker.asc
    chmod a+r /etc/apt/keyrings/docker.asc

    . /etc/os-release
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $VERSION_CODENAME stable" \
      > /etc/apt/sources.list.d/docker.list

    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    systemctl enable docker
    systemctl start docker

    usermod -aG docker ubuntu

    mkdir -p /opt/cloudnative
    chown -R ubuntu:ubuntu /opt/cloudnative

    # Install and start AWS Systems Manager Agent and AWS CLI
    snap install amazon-ssm-agent --classic || true
    snap install aws-cli --classic || true
    ln -sf /snap/bin/aws /usr/local/bin/aws || true

    systemctl enable snap.amazon-ssm-agent.amazon-ssm-agent.service
    systemctl restart snap.amazon-ssm-agent.amazon-ssm-agent.service
  EOF

  tags = {
    Name = "cloudnative-server"
  }
}
