var request = require("request");
var fs = require("fs");
var url = require("url");
var async = require("async");

var HOST = "192.168.1.163"
var PROTOCOL = "http"

var VERSION = "0.100.101";
var APPLICATION = "otaupdate";
var APIKEY = "db396724456fa1ece579b134e00c05d0d851431aff0decad4852e2bf48a8ad64"

var IMAGE1 = "/512_user1.bin";
var IMAGE2 = "/512_user2.bin";

var files = {
  image1: __dirname + IMAGE1,
  image2: __dirname + IMAGE2
}

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

// for registering new version
var register_version_url = url.format({
    protocol: PROTOCOL,
    host: HOST,
    pathname: "/api/"+APPLICATION+"/versions"
  })

var register_version_options = {
  url: register_version_url,
  headers: {
    "api-key": APIKEY,
    "Content-Type": "application/json"
  },

}

var uploaded_url = [];

async.forEachOf(files, function(value, key, callback) {
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
  if (err) console.error(err.message);
  register_version(uploaded_url);
})

function register_version(firmware_urls) {
  // console.log(firmware_urls);
  register_version_options.body = JSON.stringify({
    "version": VERSION,
    "firmwares": firmware_urls
  });
  request.post(register_version_options, function optionalCallback(err, httpResponse, body) {
    if (err) {
      return console.error('upload firmware data failed:', err);
    }
    console.log('Register application ' + APPLICATION + ', version ' + VERSION +' successful!');
    console.log(body);
  });
}
