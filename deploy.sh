#!/bin/bash
set -e

echo "=== Kyron Medical Deployment ==="

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 and serve globally
sudo npm install -g pm2

# Install Nginx
sudo apt-get install -y nginx

# Install server dependencies
cd /home/ubuntu/kyron-medical-patient-portal/server
npm install --production

# Install client dependencies and build
cd /home/ubuntu/kyron-medical-patient-portal/client
npm install
npm run build

# Copy nginx config
sudo cp /home/ubuntu/kyron-medical-patient-portal/nginx.conf /etc/nginx/sites-available/kyron-medical
sudo ln -sf /etc/nginx/sites-available/kyron-medical /etc/nginx/sites-enabled/kyron-medical
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# Start server with PM2
cd /home/ubuntu/kyron-medical-patient-portal/server
pm2 delete kyron-server 2>/dev/null || true
pm2 start server.js --name kyron-server
pm2 save
pm2 startup

echo "=== Deployment Complete ==="
