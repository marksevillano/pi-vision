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

const imgPath = '/home/pi/pi-vision/src/img/image1.jpg';
const soundPath = '/home/pi/pi-vision/src/sound/sound1.mp3';

function googleDetection() {
    return client
    .labelDetection(imgPath)
    .then(results => {
        const labels = results[0].labelAnnotations;

        console.log('Labels:----------------------------------');
        labels.forEach(label => console.log(label.description));
        console.log(labels);
        if(labels.length > 0) {
            console.log('Label:' + labels[0].description);
            return labels[0].description;
        } else {
            return '';
        }
    })
    .catch(err => {
        console.error('ERROR:', err);
    });
}

function beep() {
    exec('mplayer /home/pi/pi-vision/src/sound/beep.mp3', function(error, stdout, stderr) {        
        if(!error) {
            console.log("Process started/ended");
        } else {
            console.log('Didnt played beep.');
        }

    });
}

function logoDetection() {
    return client.logoDetection(imgPath).then(results => {
        const logos = results[0].logoAnnotations;
        console.log('Logos:--------------------------');
        logos.forEach(logo => console.log(logo.description));
        if(logos.length > 0) {
            console.log('Logo:' + logos[0].description);
            return logos[0].description;
        } else {
            return '';
        }
    })
    .catch(err => {
        console.error('ERROR:', err);
    });
}

function textDetection() {
    return client.textDetection(imgPath).then(results => {
        const texts = results[0].textAnnotations;
        var textStr = '';
        console.log('Texts:--------------------------');
        texts.forEach(text => textStr+= text.description + ', ');
        if(texts.length > 0) {
            console.log('texts: :' + texts.join(" "));
            return textStr;
        } else {
            return '';
        }
    })
    .catch(err => {
        console.error('ERROR:', err);
    });
}

function faceDetection() {
    return client.faceDetection(imgPath).then(results => {
        const faces = results[0].faceAnnotations;
        var faceStr = '';
        console.log('Faces:--------------------------');
        faceStr += faces.length.toString() + ((faces.length >1) ? 'faces': 'face') + 'are detected.';
        var counthappy = 0;
        var countsad = 0;
        var countsurprised = 0;
        var countangry = 0;
        faces.forEach(function(face) {
            if(face.joyLikelihood == "VERY_LIKELY") {
                counthappy ++;
            } else if (face.sorrowLikelihood == "VERY_LIKELY") {
                countsad ++;
            } else if(face.angerLikelihood == "VERY_LIKELY") {
                countangry++;
            } else if(face.surpriseLikelihood == "VERY_LIKELY") {
                countsurprised ++;
            }
        });
        if(faces.length > 0) {
            if (counthappy > 0) {
                faceStr += 'There are ' + counthappy.toString() + (counthappy>1)? ' happy faces. ':' happy face. ';
            } 
            if(countsad > 0) {
                faceStr += 'There are ' + countsad.toString() + (countsad>1)? ' sad faces. ':' sad face. ';
            }
            if(countangry > 0) {
                faceStr += 'There are ' + countangry.toString() +  (countangry>1)? ' angry faces. ':' angry face. ';
            }
            if(countsurprised > 0) {
                faceStr += 'There are ' + countsurprised.toString() + (countsurprised>1)? ' surpised faces. ':' surpised face. ';
            }
            return faceStr;
        } else {
            return 'There are no faces detected.';
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
        var text = textDetection();
        //var face = faceDetection();
        var results = [logo, label, text];//face
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
                message += 'Object detected is ' + values[1] + '. ';
            }

            if(values[2] != '') {
                console.log("three");
                console.log(values[2]);
                message += 'Text detected is: ' + values[2] + '. ';
            }
            // if(values[3] != '') {
            //     console.log("four");
            //     console.log(values[3]);
            //     message += values[3];
            // }
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
                  playAudio(soundPath, res);
                  
                });
              });
            
        }).catch(function () {
            return res.end("{ error: 'error somewhere in request'}");
        });
        
    } catch {
        return res.end("{ error: 'error somewhere in request'}");
    }
    
}

function playAudio(soundPath, res) {
    exec('mplayer ' + soundPath, function(error, stdout, stderr) {        
        if(!error) {
            return res.redirect('/');
        } else {
            console.log('Didnt played audio.');
        }

    });
}

app.get('/', (request, response) => {
    response.sendFile(__dirname + '/view/index.html');  
})

app.get('/capture',(req, res)=> {
    //res.setHeader('Content-Type', 'application/json');
    beep();
    setTimeout(function() {
        exec("sudo raspistill -o /home/pi/pi-vision/src/img/image1.jpg;"+'export GOOGLE_APPLICATION_CREDENTIALS="/home/pi/Downloads/My First Project-81bc6fdab95e.json";', function(error, stdout, stderr) {
            console.log(stdout);
            if(error) {
                return res.end("{ response: 'with error', error:" + error + "}");
            } else {
                beep();
                return generateSound(res);
            }
        });
    }, 1000)
})

app.get('/replay',(req, res)=> {
    //res.setHeader('Content-Type', 'application/json');
    playAudio(soundPath, res);
})

app.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server is listening on ${port}`)
})