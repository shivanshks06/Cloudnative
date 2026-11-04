resource "aws_iam_role" "cloudnative_ec2_role" {
  name = "cloudnative-ec2-ssm-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })

  tags = {
    Name = "cloudnative-ec2-ssm-role"
  }
}

resource "aws_iam_role_policy_attachment" "ssm_managed_instance" {
  role       = aws_iam_role.cloudnative_ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "cloudnative_profile" {
  name = "cloudnative-ec2-instance-profile"
  role = aws_iam_role.cloudnative_ec2_role.name
}

