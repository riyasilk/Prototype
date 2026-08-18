# Production VPS Deployment Guide (PM2 + Nginx)

This guide walks you through deploying the **Riya Silk** application stack on an Ubuntu VPS using **PM2** for process management, **Nginx** as a reverse proxy, and **Certbot** for Let's Encrypt SSL certificates.

---

## Prerequisites

1. An **Ubuntu VPS** (e.g., DigitalOcean, AWS EC2, Linode) with at least 1GB RAM.
2. A **Domain Name** (e.g., `riyasilk.com`) with DNS `A` records pointed to your VPS IP address.
3. SSH access with root or sudo privileges.

---

## Step 1: System Updates & Dependencies

Connect to your VPS via SSH and install required dependencies:

```bash
# Update package lists
sudo apt update && sudo apt upgrade -y

# Install Node.js (Node 20)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Git, Nginx, Certbot (for SSL), and build-essential
sudo apt install -y git nginx certbot python3-certbot-nginx build-essential

# Verify installations
node -v
npm -v
nginx -v
```

### Critical: Configure Swap Space (For 1GB / 2GB RAM VPS)
Next.js production builds require substantial memory. If your server has 1GB or 2GB of RAM, compile steps will likely fail due to Out of Memory (OOM) errors. Add 4GB of swap space to ensure smooth builds:

```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## Step 2: Install and Configure PostgreSQL

Install PostgreSQL database server:

```bash
# Install Postgres database
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Access PostgreSQL CLI
sudo -i -u postgres psql
```

Inside the PostgreSQL interactive shell (`psql`), create the application database and user:

```sql
-- Create database
CREATE DATABASE riya_silk;

-- Create user with secure password
CREATE USER riyasilk_user WITH PASSWORD 'ChangeThisToSecureProductionPassword';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE riya_silk TO riyasilk_user;
ALTER DATABASE riya_silk OWNER TO riyasilk_user;

-- Exit shell
\q
```

---

## Step 3: Clone Code and Prepare Environment

Clone your project repository to `/var/www/riyasilk`:

```bash
sudo mkdir -p /var/www/riyasilk
sudo chown -R $USER:$USER /var/www/riyasilk
git clone <YOUR_GIT_REPOSITORY_URL> /var/www/riyasilk
cd /var/www/riyasilk
```

### Environment Configurations

1. **Backend Configuration**:
   Copy the backend production template and edit it:
   ```bash
   cp backend/.env.production backend/.env
   nano backend/.env
   ```
   * Set `DATABASE_URL` to:
     `postgresql://riyasilk_user:ChangeThisToSecureProductionPassword@127.0.0.1:5432/riya_silk?schema=public`
   * Update SMTP and JWT secrets with your production values.

2. **Frontend Configuration**:
   Create the frontend environment file:
   ```bash
   nano frontend/.env.production
   ```
   Add:
   ```env
   NEXT_PUBLIC_API_URL=https://riyasilk.com
   ```

---

## Step 4: Build Applications

Install dependencies and compile production code for both services:

```bash
# Install root workspace and subfolder dependencies
npm install

# Build backend NestJS & Prisma
cd backend
npm install
npx prisma generate
npx prisma migrate deploy  # Applies pending migrations safely — never drops data
npm run build
cd ..

# Build frontend Next.js
cd frontend
npm install
npm run build
cd ..
```

---

## Step 5: Process Management with PM2

Install **PM2** globally:

```bash
sudo npm install -g pm2
```

We have prepared a PM2 configuration at the root of the project: `ecosystem.config.js`. Update the production settings inside it:

```bash
nano ecosystem.config.js
```
*Make sure `NEXT_PUBLIC_API_URL` matches your actual domain: `https://riyasilk.com`.*

Start applications under PM2 process manager:

```bash
# Start backend and frontend services
pm2 start ecosystem.config.js --env production

# Save current PM2 processes list
pm2 save

# Generate PM2 OS startup hook (runs on VPS reboots)
pm2 startup
```
*Run the resulting shell command printed on screen by `pm2 startup` to complete startup hook registration.*

---

## Step 6: Configure Nginx & Activate SSL Certificates

Nginx will serve as our reverse proxy, mapping incoming HTTPS traffic to our Next.js and NestJS servers.

Copy our server template into Nginx directories:

```bash
sudo cp riyasilk.conf /etc/nginx/sites-available/riyasilk.conf
```

Edit the Nginx configuration to replace `riyasilk.com` and `www.riyasilk.com` with your domain:

```bash
sudo nano /etc/nginx/sites-available/riyasilk.conf
```

Enable the Nginx block and restart Nginx:

```bash
# Enable site configuration
sudo ln -s /etc/nginx/sites-available/riyasilk.conf /etc/nginx/sites-enabled/

# Disable default nginx configuration to prevent conflicts
sudo rm /etc/nginx/sites-enabled/default

# Test configuration syntax
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Install SSL Certificates via Certbot

Generate HTTPS certificates from Let's Encrypt:

```bash
sudo certbot --nginx -d riyasilk.com -d www.riyasilk.com
```
*Certbot will automatically verify the DNS records, request SSL certificates, and configure Nginx to use them, enabling a secure lock icon next to your website.*

---

## Step 7: Firewalls & Maintenance

Enable the UFW firewall to block unneeded ports, leaving only HTTP, HTTPS, and SSH open:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### Useful Maintenance Commands

```bash
# Check service logs in real time
pm2 logs

# Monitor CPU / Memory of processes
pm2 monit

# Restart services after a git pull updates files
git pull
cd backend && npx prisma migrate deploy && npm run build
cd ../frontend && npm run build
cd ..
pm2 reload all
```
