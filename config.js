module.exports = {
    serviceName: "buildImages",
    servicePort: 4100,
    extKeyRequired: false,

    "FILES": __dirname + "/FILES/",
    "workingDir": "/opt/tmp/",
    "localSrcDir": "/opt/soajs/node_modules/",

    "imagePrefix": {
        "core": "antoinehage/",
        "custom": "antoinehage/"
    },

    "dockerTemnplates": {
        "nginx": {
            "from": 'FROM ubuntu',
            "maintainer": 'MAINTAINER SOAJS Team <team@soajs.org>',
            "body": [
                'RUN apt-get update && apt-get install -y nginx nodejs && ln -s /usr/bin/nodejs /usr/bin/node && mkdir -p /opt/soajs/FILES',
                'RUN echo "daemon off;" >> /etc/nginx/nginx.conf',
                'ADD ./FILES /opt/soajs/FILES/',
                'RUN chmod +x /opt/soajs/FILES/runNginx.sh',
                'EXPOSE #SERVICEPORT#',
                'CMD /opt/soajs/FILES/runNginx.sh']
        },
        "soajs": {
            "from": 'FROM ubuntu',
            "maintainer": 'MAINTAINER SOAJS Team <team@soajs.org>',
            "body": [
                'RUN apt-get update && apt-get install -y nodejs npm && ln -s /usr/bin/nodejs /usr/bin/node && mkdir -p /opt/soajs/node_modules && mkdir -p /opt/soajs/FILES && mkdir /opt/node_modules',
                'ADD ./FILES /opt/soajs/FILES/',
                'ENV NODE_ENV=production',
                'RUN cd /opt/soajs/FILES && cd ./#SERVICEFOLDERNAME# && npm install && cd ../ && mv ./#SERVICEFOLDERNAME# /opt/soajs/node_modules/',
                'CMD ["/bin/bash"]']
        }
    },

    "errors": {
        "402": "No Uploaded files where detected.",
        "403": "Invalid file uploaded! make sure you zip your service before you upload it."
    },
    "schema": {
        "/buildSoajsImage": {
            "_apiInfo": {
                "l": "Dockernize soajs core"
            },
            "vLabel": {
                "source": ['query.vLabel'],
                "required": false,
                "validation": {
                    "type": "string"
                }
            },
            "vForce": {
                "source": ['query.vForce'],
                "required": false,
                "validation": {
                    "type": "boolean"
                }
            }
        }
    }
};