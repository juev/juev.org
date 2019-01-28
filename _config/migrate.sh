#!/bin/bash

if [ "$EUID" -ne 0 ]
then echo "Please run as root"
  exit
fi

if [ ! -f "/root/letsencrypt.tar.gz" ]
then echo "Please upload letsencrypt.tar.gz file to root directory to continue"
     exit
fi

cd ~

apt-get update &&
    DEBIAN_FRONTEND=noninteractive apt-get -y upgrade

if not command -v aptitude >/dev/null 2>&1; then
    DEBIAN_FRONTEND=noninteractive apt-get -y install aptitude
fi

DEBIAN_FRONTEND=noninteractive aptitude -y install openntpd git htop
echo "Europe/Samara" > /etc/timezone
dpkg-reconfigure -f noninteractive tzdata

# install ikev2
mkdir Projects && cd Projects/
git clone https://github.com/Juev/debian-ikev2-vpn-server.git
cd debian-ikev2-vpn-server/
./install.sh

cd ~

# install nginx
cat <<EOF > /etc/apt/sources.list.d/nginx.list
deb http://nginx.org/packages/debian/ jessie nginx
deb-src http://nginx.org/packages/debian/ jessie nginx
EOF

wget http://nginx.org/keys/nginx_signing.key
apt-key add nginx_signing.key
rm nginx_signing.key
aptitude update
DEBIAN_FRONTEND=noninteractive aptitude -y install nginx
DEBIAN_FRONTEND=noninteractive aptitude -y install certbot -t jessie-backports

# configuring nginx
wget -O /etc/nginx/conf.d/juevorg.conf https://raw.githubusercontent.com/Juev/juev.org/master/config/juevorg.conf
[ -f "/etc/nginx/nginx.conf" ] && rm /etc/nginx/nginx.conf
wget -O /etc/nginx/nginx.conf https://raw.githubusercontent.com/Juev/juev.org/master/config/nginx.conf
mv /etc/nginx/conf.d/default.conf{,.disabled}

# configuring public directory
adduser --disabled-password --gecos "" web
su -c "mkdir -p /home/web/public/juev.org/" web
su -c "mkdir /home/web/.ssh" web
su -c "chmod 0700 /home/web/.ssh" web
su -c "wget -O /home/web/.ssh/authorized_keys https://raw.githubusercontent.com/Juev/juev.org/master/config/authorized_keys" web
su -c "chmod 0600 /home/web/.ssh/authorized_keys" web

cd ~
tar xf letsencrypt.tar.gz
mv etc/letsencrypt /etc/
rm -rf ~/letsencrypt.tar.gz ~/etc/

# generate dhparam key
openssl dhparam -out /etc/ssl/certs/dhparam.pem 4096
service nginx restart

crontab -l > file; echo '00 01,13 * * * certbot renew --quiet' >> file; crontab file; rm file
