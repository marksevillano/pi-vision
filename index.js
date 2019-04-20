const express = require('express')
const app = express()
const port = 3000
// Imports the Google Cloud client library
const vision = require('@google-cloud/vision');
// Creates a client
const client = new vision.ImageAnnotatorClient();
var sys = require('sys')
var exec = require('child_process').exec;
var child;

path = '';

function googleDetection() {
    client
    .labelDetection('./src/img/image1.jpg')
    .then(results => {
        const labels = results[0].labelAnnotations;

        console.log('Labels:');
        labels.forEach(label => console.log(label.description));
    })
    .catch(err => {
        console.error('ERROR:', err);
    });
}

app.get('/', (request, response) => {
    response.sendFile(__dirname + '/view/index.html');  
})

app.get('/capture',(req, res)=> {
    res.setHeader('Content-Type', 'application/json');
    exec("sudo raspistill -o ./src/img/image1.jpg", function(error, stdout, stderr) {
        console.log(stdout);
        if(error) {
            return res.end("{ response: 'with error', error:" + error + "}");
        } else {
            return res.end("{ response: 'success'}");
        }
    });
    //return "success2";
})

app.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server is listening on ${port}`)
})