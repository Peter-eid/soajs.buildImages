'use strict';

const fs = require('fs');
const path = require('path');
const log = require('util').log;
const config = require('../../config.js');

let builder = {

    /**
     * Function that writes the default upstream.conf file for soajs.controller
     * @param  {Object}   options An object that contains params passed to the function
     * @param  {Function} cb      Callback function
     *
     */
    writeUpstream(options, cb) {
        log("Writing upstream.conf in " + options.loc);
        let wstream = fs.createWriteStream(options.loc + 'upstream.conf');
        wstream.write("upstream " + options.upstreamName + " {\n");
        for (let i = 1; i <= options.count; i++) {
            if (process.env[options.ipEnvName + i]) {
                wstream.write("  server " + process.env[options.ipEnvName + i] + ":" + options.port + ";\n");
            }
            else {
                log("ERROR: Unable to find environment variable " + options.ipEnvName + i);
            }
        }
        wstream.write("}\n");
        wstream.end();
        return cb(null);
    },

    /**
     * Function that writes nginx config for static location
     * @param  {Object}   options An object that contains params passed to the function
     * @param  {Object}   wstream An instance of fs.writeStream
     *
     */
    writeStaticLocation(options, wstream) {
        wstream.write("  location / {\n");
        wstream.write("    root  " + options.path + ";\n");
        wstream.write("    sendfile       off;\n");
        wstream.write("    index  index.html index.htm;\n");
        wstream.write("  }\n");
    },

    /**
     * Function that writes nginx config for proxy location
     * @param  {Object}   options An object that contains params passed to the function
     * @param  {Object}   wstream An instance of fs.writeStream
     *
     */
    writeProxyLocation(options, wstream) {
        wstream.write("  location / {\n");
        wstream.write("    proxy_pass 		    http://" + options.upstreamName + ";\n");
        wstream.write("    proxy_set_header   	X-Forwarded-Proto 	    $scheme;\n");
        wstream.write("    proxy_set_header   	X-Forwarded-For 	    $remote_addr;\n");
        wstream.write("    proxy_set_header   	Host             		$http_host;\n");
        wstream.write("    proxy_set_header   	X-NginX-Proxy     	    true;\n");
        wstream.write("    proxy_set_header   	Connection        	    \"\";\n");
        wstream.write("  }\n");
    },

    /**
     * Function that writes nginx config for server redirect
     * @param  {Object}   options An object that contains params passed to the function
     * @param  {Object}   wstream An instance of fs.writeStream
     *
     */
    writeServerRedirect(options, wstream) {
        wstream.write("server {\n");
        wstream.write("  listen       " + options.port + ";\n");
        wstream.write("  server_name  " + options.domain + ";\n");
        wstream.write("  client_max_body_size 100m;\n");
        wstream.write("  rewrite ^/(.*) https://" + options.domain + "/$1 permanent;\n");
        wstream.write("}\n");
    },

    /**
     * Function that writes nginx SSL config
     * @param  {Object}   options An object that contains params passed to the function
     *
     */
    writeServerSSL(wstream) {
        let certsLocation = path.join(config.nginx.location, '/ssl');
        if (config.nginx.config.ssl.customCerts) certsLocation = config.nginx.config.ssl.customCertsPath;

        wstream.write("  ssl_certificate         " + certsLocation + "/tls.crt;\n");
        wstream.write("  ssl_certificate_key     " + certsLocation + "/tls.key;\n");
        wstream.write("  include " + config.nginx.location + "/ssl/ssl.conf;\n");
    },

    /**
     * Function that writes nginx config for server
     * @param  {Object}   options An object that contains params passed to the function
     * @param  {Object}   wstream An instance of fs.writeStream
     *
     */
    writeServer(options, wstream) {
        wstream.write("server {\n");
        wstream.write("  listen       " + options.port + ";\n");
        wstream.write("  server_name  " + options.domain + ";\n");
        wstream.write("  client_max_body_size 100m;\n");
        if (options.https)
            builder.writeServerSSL(wstream);
        if (options.location == "proxy")
            builder.writeProxyLocation(options, wstream);
        else if (options.location == "static")
            builder.writeStaticLocation(options, wstream);
        wstream.write("}\n");
    },

    /**
     * Function that redirects to proper write function for api config based on passed params
     * @param  {Object}   options An object that contains params passed to the function
     * @param  {Function} cb      Callback function
     *
     */
    writeApiConf(options, cb) {
        log("writing api conf in " + options.loc + " " + options.confFileName);
        let wstream = fs.createWriteStream(options.loc + options.confFileName);
        let httpsApi = config.nginx.config.ssl.httpsApi;
        let httpApiRedirect = config.nginx.config.ssl.httpApiRedirect;

        options.location = "proxy";

        if (httpsApi) {
            if (httpApiRedirect) {
                options.port = "80";
                builder.writeServerRedirect(options, wstream);
            }
            options.https = true;
            options.port = "443 ssl";
            builder.writeServer(options, wstream);
        }
        else if (!httpApiRedirect){
            options.port = "80";
            builder.writeServer(options, wstream);
        }

        wstream.end();
        return cb(null);
    },

    /**
     * Function that redirects to proper write function for site config based on passed params
     * @param  {Object}   options An object that contains params passed to the function
     * @param  {Function} cb      Callback function
     *
     */
    writeSiteConf(options, cb) {
        log("writing site conf in " + options.loc + " " + options.confFileName);
        let wstream = fs.createWriteStream(options.loc + options.confFileName);
        let httpsSite = config.nginx.config.ssl.httpsSite;
        let httpSiteRedirect = config.nginx.config.ssl.httpSiteRedirect;

        options.location = "static";

        if (httpsSite) {
            if (httpSiteRedirect) {
                options.port = "80";
                builder.writeServerRedirect(options, wstream);
            }
            options.https = true;
            options.port = "443 ssl";
            builder.writeServer(options, wstream);
        }
        else if (!httpSiteRedirect){
            options.port = "80";
            builder.writeServer(options, wstream);
        }

        wstream.end();
        return cb(null);
    },

    /**
     * Function that calls writeUpstream, writeApiConf, and writeSiteConf
     * @param  {Object}   options An object that contains params passed to the function
     * @param  {Object}   wstream An instance of fs.writeStream
     *
     */
    write(options, cb) {
        builder.writeUpstream({
            loc: options.nginx.location + ((nxOs === 'mac') ? "/servers/" : ( nxOs === 'ubuntu') ? "/conf.d/" : "/nginx/"),
            port: options.nginx.config.upstream.ctrlPort,
            ipEnvName: options.nginx.config.upstream.ipEnvName,
            upstreamName: options.nginx.config.upstream.upstreamName,
            count: options.nginx.config.upstream.count,
        }, () => {
            log('SOAJS Controller Upstream was written successfully');
            builder.writeApiConf({
                loc: options.nginx.location + ((nxOs === 'mac') ? "/servers/" : ( nxOs === 'ubuntu') ? "/sites-enabled/" : "/nginx/"),
                confFileName: options.nginx.config.apiConf.fileName,
                domain: options.nginx.config.apiConf.domain,
                upstreamName: options.nginx.config.upstream.upstreamName,
            }, () => {
                log('Nginx API config was written successfully');
                if (options.nginx.config.siteConf.domain) {
                    builder.writeSiteConf({
                        loc: options.nginx.location + ((nxOs === 'mac') ? "/servers/" : ( nxOs === 'ubuntu') ? "/sites-enabled/" : "/nginx/"),
                        confFileName: options.nginx.config.siteConf.fileName,
                        domain: options.nginx.config.siteConf.domain,
                        path: options.nginx.config.siteConf.path
                    }, () => {
                        log('Nginx Site config was written successfully');
                        return cb();
                    });
                }
                else {
                    return cb();
                }
            });
        });
    }

};

module.exports = {
    writeDefaultConf: builder.write
};
