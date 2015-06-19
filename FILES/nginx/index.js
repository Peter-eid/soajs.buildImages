'use strict';
var fs = require('fs');

var nbController = process.env.SOAJS_NX_NBCONTROLLER || 1;
var apiDomain = process.env.SOAJS_NX_APIDOMAIN || "api.yourdomain.com";
var dashDomain = process.env.SOAJS_NX_DASHDOMAIN || null;
var apiPort = process.env.SOAJS_NX_APIPORT || "8080";
var hostPrefix = process.env.SOAJS_NX_HOSTPREFIX || "controllerProxy";
var controllerPort = process.env.SOAJS_NX_CONTROLLERPORT || "4000";

var upstreamName = "soajs.controller";

var lib = {
    "writeUpstream": function (param, cb) {
        var wstream = fs.createWriteStream(param.loc + 'upstream.conf');
        wstream.write("upstream " + upstreamName + " {\n");
        for (var i = 1; i <= nbController; i++) {
            var s = "000" + i;
            s = s.substr(s.length-2);
            wstream.write("  server "+hostPrefix+s+":"+controllerPort+";\n");
        }
        wstream.write("}\n");
        wstream.end();
        return cb(null);
    },
    "writeApiConf": function (param, cb) {
        var wstream = fs.createWriteStream(param.loc + 'api.conf');
        wstream.write("server {\n");
        wstream.write("  server_name  "+apiDomain+";\n");
        wstream.write("  listen       "+apiPort+";\n");
        wstream.write("  location / {\n");
        wstream.write("    proxy_pass 		    http://" + upstreamName + ";\n");
        wstream.write("    proxy_set_header   	X-Forwarded-Proto 	    $scheme;\n");
        wstream.write("    proxy_set_header   	Host             		$http_host;\n");
        wstream.write("    proxy_set_header   	X-NginX-Proxy     	    true;\n");
        wstream.write("    proxy_set_header   	Connection        	    \"\";\n");
        wstream.write("  }\n");
        wstream.write("}\n");
        wstream.end();
        return cb(null);
    },
    "writeDashConf": function (param, cb) {
        var wstream = fs.createWriteStream(param.loc + 'dash.conf');
        wstream.write("server {\n");
        wstream.write("  server_name  "+dashDomain+";\n");
        wstream.write("  location / {\n");
        wstream.write("    root   /opt/soajs/node_modules/soajs.dashboard/ui;\n");
        wstream.write("    index  index.html index.htm;\n");
        wstream.write("  }\n");
        wstream.write("}\n");
        wstream.end();
        return cb(null);
    }
};

lib.writeUpstream({"loc": "/etc/nginx/conf.d/"},function(err){
    console.log ("NGINX UPSTREAM DONE.");
});
lib.writeApiConf ({"loc": "/etc/nginx/sites-enabled/"},function(err){
    console.log ("NGINX API CONF DONE.");
});
if (dashDomain) {
    lib.writeDashConf({"loc": "/etc/nginx/sites-enabled/"}, function (err) {
        console.log("NGINX DASH CONF DONE.");
    });
}