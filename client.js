var request = require("request");
var fs = require("fs");
var url = require("url");
var async = require("async");

var HOST = "localhost"
var PROTOCOL = "http"

var VERSION = "1.100.100";
var APPLICATION = "otaupdate";
var APIKEY = "db396724456fa1ece579b134e00c05d0d851431aff0decad4852e2bf48a8ad64"

var IMAGE1 = "/512_user1.bin";
var IMAGE2 = "/512_user2.bin";

var files = {
  image1: __dirname + IMAGE1,
  image2: __dirname + IMAGE2
}

console.log(files);

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

var uploaded_url = {};

async.forEachOf(files, function(value, key, callback) {
  upload_options.formData = {
    data: fs.createReadStream(value)
  }
  request.post(upload_options, function optionalCallback(err, httpResponse, body) {
    if (err) {
      return callback(err);
    }
    body = JSON.parse(body);
    uploaded_url[key] = body.parseUrl.path;
    callback();
  });
}, function(err) {
  if (err) console.error(err.message);
  console.log(uploaded_url);
})

/*
var firmware_options = {
  url: "http://localhost/api/"+APPLICATION+"/versions",
  headers: {
    "api-key": APIKEY,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    "version": VERSION,
    "firmwares": [{
        "name": "image1",
        "url": "http://localhost:3000/firmwares/5572bd3797accd181656e4c7/download"
    },
    {
        "name": "image2",
        "url": "http://localhost:3000/firmwares/5572bd3897accd181656e4c8/download"
    }]    
  })
}

request.post(firmware_options, function optionalCallback(err, httpResponse, body) {
  if (err) {
    return console.error('upload firmware data failed:', err);
  }
  console.log('Upload successful!  Server responded with:', body);
});
*/