#!/usr/bin/env node
var request = require("request");
var fs = require("fs");
var url = require("url");
var async = require("async");
var argv = require('minimist')(process.argv.slice(2));
var fs = require('fs');

/* checking input */
if (!(argv.version && argv.i1 && argv.i2 && argv.application)) {
  console.error('Fail. Need to provide version, image 1 path, and image 2 path');
  return;
}

/* read configuration */
var config_file = (argv.config)? (argv.config): (process.env.HOME+"/.fotaclient-config.json");
var config_profile = (argv.profile)? (argv.profile): "DEMO";

if (!fs.existsSync(config_file)) {
  console.log('Fail. Check the config file at ', config_file);
  return;
}

var err, data = fs.readFileSync(config_file);

if (err) {
  console.log(err)
  return;
}

var config;
try {
  config = JSON.parse(data);
} catch (e) {
  console.log('Fail. Configuration file ' + config_file + ' is not a JSON');
  return;
}
var HOST = config[config_profile].HOST;
var PROTOCOL = config[config_profile].PROTOCOL;
var APIKEY = config[config_profile].APIKEY;

/* prepare 2 images for ESP */
var files = {
  image1: argv.i1,
  image2: argv.i2
}

/* upload firmwares */
var uploaded_url = [];

async.forEachOf(files, function(value, key, callback) {
  // for uploading firmware files
  var upload_firmware_url = url.format({
      protocol: PROTOCOL,
      host: HOST,
      pathname: "/api/firmware"
    })

  var upload_options = {
    url: upload_firmware_url,
    headers: {
      "api-key": APIKEY
    },
    formData: {}
  }

  upload_options.formData = {
    data: fs.createReadStream(value)
  }
  request.post(upload_options, function optionalCallback(err, httpResponse, body) {
    if (err) {
      return callback(err);
    }
    if (httpResponse.statusCode != 201) {
      return callback(new Error('Cannot upload firmware'))
    }
    body = JSON.parse(body);
    uploaded_url.push({
      name: key,
      url: url.format({
        protocol: PROTOCOL,
        host: HOST,
        pathname: body.parseUrl.path
      })
    })
    callback();
  });
}, function(err) {
  if (err) {
    return console.error(err.message);
  }

  console.log('Uploaded images successful', uploaded_url);
  register_version(uploaded_url);
})

/* register new version with urls */
function register_version(firmware_urls) {
  // for registering new version
  var register_version_url = url.format({
      protocol: PROTOCOL,
      host: HOST,
      pathname: "/api/"+argv.application+"/versions"
    })

  var register_version_options = {
    url: register_version_url,
    headers: {
      "api-key": APIKEY,
      "Content-Type": "application/json"
    }
  }

  register_version_options.body = JSON.stringify({
    "version": argv.version,
    "firmwares": firmware_urls
  });
  request.post(register_version_options, function optionalCallback(err, httpResponse, body) {
    if (err) {
      return console.error('Register failed:', err);
    }
    if (httpResponse.statusCode != 201) {
      return console.error("Failed to register new version, make sure you did create new application name ", argv.application);
    }
    console.log('Register application ' + argv.application + ', version ' + argv.version +' successful!');
    console.log('Done!');
  });
}
