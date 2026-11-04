terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0, < 7.0"
    }
  }
}

provider "aws" {
  region  = "ap-south-1"
  profile = "cloudnative"

  default_tags {
    tags = {
      Project     = "CloudNative"
      Environment = "Development"
      ManagedBy   = "Terraform"
    }
  }
}
