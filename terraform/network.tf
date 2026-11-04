# 1. Create VPC
resource "aws_vpc" "cloudnative_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "cloudnative-vpc"
  }
}

# 2. Create Public Subnet
resource "aws_subnet" "cloudnative_public_subnet" {
  vpc_id                  = aws_vpc.cloudnative_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "ap-south-1a"
  map_public_ip_on_launch = true

  tags = {
    Name = "cloudnative-public-subnet"
  }
}

# 3. Create Internet Gateway
resource "aws_internet_gateway" "cloudnative_igw" {
  vpc_id = aws_vpc.cloudnative_vpc.id

  tags = {
    Name = "cloudnative-igw"
  }
}

# 4. Create Route Table
resource "aws_route_table" "cloudnative_public_rt" {
  vpc_id = aws_vpc.cloudnative_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.cloudnative_igw.id
  }

  tags = {
    Name = "cloudnative-public-rt"
  }
}

# 5. Associate Route Table with Subnet
resource "aws_route_table_association" "cloudnative_public_assoc" {
  subnet_id      = aws_subnet.cloudnative_public_subnet.id
  route_table_id = aws_route_table.cloudnative_public_rt.id
}
