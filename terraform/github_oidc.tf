# GitHub Actions OIDC Identity Provider
resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = [
    "sts.amazonaws.com"
  ]

  thumbprint_list = [
    "541176fd43c6f2df1e3c7ae9aad020187dbcdb24",
    "6938fd4d98bab03faadb97b34396831e3780aea1",
    "1c5860f56021f76548f607d06470d0db719709a8",
    "ab9d0263244dd0326eb67015705a667e79cfe998"
  ]

  tags = {
    Name = "github-actions-oidc"
  }
}

# IAM Role assumed by GitHub Actions
resource "aws_iam_role" "github_actions" {
  name = "cloudnative-github-actions-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"

      Principal = {
        Federated = aws_iam_openid_connect_provider.github.arn
      }

      Action = "sts:AssumeRoleWithWebIdentity"

      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
        }
        StringLike = {
          "token.actions.githubusercontent.com:sub" = [
            "repo:shivanshks06/*",
            "repo:shivanshks06/Cloudnative:*",
            "repo:shivanshks06/cloudnative:*"
          ]
        }
      }
    }]
  })
}

# Permissions for SSM deployment
resource "aws_iam_role_policy" "github_ssm_deployment" {
  name = "cloudnative-ssm-deployment"
  role = aws_iam_role.github_actions.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:SendCommand"
        ]
        Resource = [
          "arn:aws:ssm:ap-south-1::document/AWS-RunShellScript",
          "arn:aws:ec2:ap-south-1:802814881052:instance/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetCommandInvocation",
          "ssm:ListCommandInvocations",
          "ssm:ListCommands",
          "ssm:DescribeInstanceInformation"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:PutParameter"
        ]
        Resource = [
          "arn:aws:ssm:ap-south-1:802814881052:parameter/cloudnative/*"
        ]
      }
    ]
  })
}

output "github_actions_role_arn" {
  description = "IAM role assumed by GitHub Actions using OIDC"
  value       = aws_iam_role.github_actions.arn
}
