const express = require('express')
const app = express()
const port = 3000
const fs = require('fs');
var sys = require('sys')
var exec = require('child_process').exec;
// Imports the Google Cloud client library
const vision = require('@google-cloud/vision');
const textToSpeech = require('@google-cloud/text-to-speech');
// Creates a client
const client = new vision.ImageAnnotatorClient();
const clientSound = new textToSpeech.TextToSpeechClient();

const imgPath = './src/img/image1.jpg';
const soundPath = './src/sound/sound1.mp3';

function googleDetection() {
    return client
    .labelDetection(imgPath)
    .then(results => {
        const labels = results[0].labelAnnotations;

        console.log('Labels:');
        labels.forEach(label => console.log(label.description));
        if(labels.length > 0) {
            return labels[0].description;
        } else {
            return '';
        }
    })
    .catch(err => {
        console.error('ERROR:', err);
    });
}

function logoDetection() {
    return client.logoDetection(imgPath).then(results => {
        const logos = results[0].logoAnnotations;
        console.log('Logos:');
        logos.forEach(logo => console.log(logo.description));
        if(logos.length > 0) {
            console.log(logos[0].description);
            return logos[0].description;
        } else {
            return '';
        }
    })
    .catch(err => {
        console.error('ERROR:', err);
    });
}

function generateSound(res) {
    try {
        var logo = logoDetection();
        var label = googleDetection();
        var results = [logo, label];
        console.log(results);
        var message = '';
        Promise.all(results).then(function(values) {
            var message = '';
            if(values[0] != '') {
                console.log("one");
                console.log(values[0]);
                message += 'There is a logo detected. The logo is ' + values[0] + '. ';
            }
    
            if(values[1] != '') {
                console.log("two");
                console.log(values[1]);
                message += 'Object detected is ' + values[1] + '.';
            }
            console.log('MESSAGE GENERATED:' + message);

            var request = {
                input: {text: message},
                // Select the language and SSML Voice Gender (optional)
                voice: {languageCode: 'en-US', ssmlGender: 'NEUTRAL'},
                // Select the type of audio encoding
                audioConfig: {audioEncoding: 'MP3'},
            };

            clientSound.synthesizeSpeech(request, (err, response) => {
                if (err) {
                  console.error('ERROR:', err);
                  return;
                }
              
                // Write the binary audio content to a local file
                fs.writeFile(soundPath, response.audioContent, 'binary', err => {
                  if (err) {
                    console.error('ERROR:', err);
                    return;
                  }
                  console.log('Audio content written to file: ' + soundPath);
                  exec('mplayer ' + soundPath, function(error, stdout, stderr) {
                        setTimeout( function() {
                            if(!error) {
                                return res.end("{ message: '"+message+"'}");
                            } else {
                                console.log('Didnt played audio.');
                            }
                        }, 3000);
                  });
                  
                });
              });
            
        }).catch(function () {
            return res.end("{ error: 'error somewhere in request'}");
        });
        
    } catch {
        return res.end("{ error: 'error somewhere in request'}");
    }
    
}

app.get('/', (request, response) => {
    response.sendFile(__dirname + '/view/index.html');  
})

app.get('/capture',(req, res)=> {
    res.setHeader('Content-Type', 'application/json');
    exec("sudo raspistill -o ./src/img/image1.jpg;"+'export GOOGLE_APPLICATION_CREDENTIALS="/home/pi/Downloads/My First Project-81bc6fdab95e.json";', function(error, stdout, stderr) {
        console.log(stdout);
        if(error) {
            return res.end("{ response: 'with error', error:" + error + "}");
        } else {
            return generateSound(res);
        }
    });
})

app.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server is listening on ${port}`)
})