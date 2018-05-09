FROM ubuntu:16.04
MAINTAINER SOAJS Team <team@soajs.org>

RUN apt-get update && \
    sudo apt-get install -y --no-install-recommends apt-utils && \
    apt-get install --fix-missing -y git curl && \
    curl -sL https://deb.nodesource.com/setup_6.x | bash && \
    apt-get install --fix-missing -y nodejs

CMD ["/bin/bash"]
