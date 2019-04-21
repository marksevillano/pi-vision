export GOOGLE_APPLICATION_CREDENTIALS="/home/pi/Downloads/My First Project-81bc6fdab95e.json"

node /home/pi/pi-vision/index.js

sleep 5

chromium-browser --noierrdialogs --kiosk http://localhost:3000/ &
