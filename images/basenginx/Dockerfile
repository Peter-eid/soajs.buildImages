FROM ubuntu:16.04
MAINTAINER SOAJS Team <peter.eid@inmobiles.net>
RUN apt-get update && \
    apt-get install --fix-missing -y git curl wget && \
    curl -sL https://deb.nodesource.com/setup_6.x | bash && \
    apt-get install --fix-missing -y nodejs && \
    echo "deb http://nginx.org/packages/ubuntu/ xenial nginx && \
    deb-src http://nginx.org/packages/ubuntu/ xenial nginx" > /etc/apt/sources.list.d/nginx.list && \
    wget https://nginx.org/keys/nginx_signing.key -O - | apt-key add - && \
    apt-get -y update && \
    apt-get install -y nginx && \
    mkdir -p /etc/nginx/sites-enabled && \
    chmod +x /etc/nginx/sites-enabled
CMD ["/bin/bash"]
