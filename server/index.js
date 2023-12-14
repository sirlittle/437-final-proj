const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const { AudioClassifier, LinuxImpulseRunner, AudioRecorder }  = require('edge-impulse-linux') 
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.on('close', () => console.log('Client disconnected'));
});


// Audio classification code
(async () => {
    try {
        
        let runner = new LinuxImpulseRunner("modelfile.eim");
        let model = await runner.init();
        let devices = await AudioRecorder.ListDevices();
        let d = devices.find(x => x.name === "USB-Audio - USB PnP Sound Device");
        let device = d.id;
        let audioClassifier = new AudioClassifier(runner, false /* verbose */);
        audioClassifier.on('noAudioError', async () => {
            console.log('');
            console.log('ERR: Did not receive any audio. Here are some potential causes:');
            console.log('* If you are on macOS this might be a permissions issue.');
            console.log('  Are you running this command from a simulated shell (like in Visual Studio Code)?');
            console.log('* If you are on Linux and use a microphone in a webcam, you might also want');
            console.log('  to initialize the camera (see camera.js)');
            await audioClassifier.stop();
            process.exit(1);
        });
        await audioClassifier.start(device);
        audioClassifier.on('result', (ev, timeMs, audioAsPcm) => {
            if (!ev.result.classification) return;
        
            // print the raw predicted values for this frame
            // (turn into string here so the content does not jump around)
            let c = ev.result.classification;
            for (let k of Object.keys(c)) {
                c[k] = c[k].toFixed(4);
            }
            console.log('[CLASSIFYING AND BROADCASTING]', timeMs + 'ms.', c);
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(c));
                }
            });

        });
            } catch (ex) {
        console.error(ex);
        process.exit(1);
    }
})();

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
