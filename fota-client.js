#!/usr/bin/env node

var request = require("request");
var fs = require("fs");
var url = require("url");
var async = require("async");
var argv = require('minimist')(process.argv.slice(2));

var HOST = "192.168.1.163"
var PROTOCOL = "http"
var APIKEY = "db396724456fa1ece579b134e00c05d0d851431aff0decad4852e2bf48a8ad64"

/* parsing input */
console.log(argv.version)
console.log(argv.application)
console.log(argv.i1)
console.log(argv.i2)

if (!(argv.version && argv.i1 && argv.i2 && argv.application)) {
  console.error('Need to provide version, image 1 path, and image 2 path');
  return;
}

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
    body = JSON.parse(body);
    uploaded_url.push({
      name: key,
      url: url.format({
        protocol: PROTOCOL,
        host: HOST,
        pathname: body.parseUrl.path
      })
    })
    // console.log(body)
    callback();
  });
}, function(err) {
  if (err) 
    return console.error(err.message);

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

  // console.log(firmware_urls);
  register_version_options.body = JSON.stringify({
    "version": argv.version,
    "firmwares": firmware_urls
  });
  request.post(register_version_options, function optionalCallback(err, httpResponse, body) {
    if (err) {
      return console.error('upload firmware data failed:', err);
    }
    if (body.error) {
      return console.error("Failed to register new version ", body.error)
    };
    console.log('Register application ' + argv.application + ', version ' + argv.version +' successful!');
  });
}
