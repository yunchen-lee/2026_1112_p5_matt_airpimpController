// MQTT broker (shiftr.io over secure WebSocket)
let broker = {
    hostname: 'public.cloud.shiftr.io',
    port: 443
};

let creds = {
    clientID: 'p5-servo-' + Math.floor(Math.random() * 0xffff).toString(16), // unique ID
    userName: 'public',
    password: 'public'
};

let topicServo = 'xfab_yclee_servo'; // payload: "index:angle"

let client;
let statusText;

// Servo on/off angles
const NUM_SERVOS = 3;
const ANGLE_ON = 70;
const ANGLE_OFF = 130;
let isOn = []; // current state per servo
let buttons = [];
let stateLabels = [];

function setup() {
    noCanvas();

    createElement('h2', 'ESP32-C3 Servo Control');
    statusText = createP('MQTT: connecting...');
    statusText.id('status');

    for (let i = 0; i < NUM_SERVOS; i++) {
        isOn[i] = false;
        let row = createDiv().class('row');
        createSpan('Servo ' + i + ' (GPIO' + (4 + i) + ')').parent(row);
        buttons[i] = createButton('ON').parent(row);
        buttons[i].mousePressed(() => toggleServo(i));
        stateLabels[i] = createSpan('').parent(row);
        updateLabel(i);
    }

    // All on / all off
    let allRow = createDiv().class('row');
    createButton('ALL ON').parent(allRow).mousePressed(() => setAll(true));
    createButton('ALL OFF').parent(allRow).mousePressed(() => setAll(false));

    client = new Paho.MQTT.Client(broker.hostname, broker.port, creds.clientID);
    client.onConnectionLost = onConnectionLost;
    client.connect({
        onSuccess: onConnect,
        onFailure: onConnectFailure,
        userName: creds.userName,
        password: creds.password,
        useSSL: true
    });
}

function toggleServo(i) {
    setServo(i, !isOn[i]);
}

function setAll(on) {
    for (let i = 0; i < NUM_SERVOS; i++) setServo(i, on);
}

function setServo(i, on) {
    if (sendServo(i, on ? ANGLE_ON : ANGLE_OFF)) {
        isOn[i] = on;
        updateLabel(i);
    }
}

function updateLabel(i) {
    let angle = isOn[i] ? ANGLE_ON : ANGLE_OFF;
    stateLabels[i].html((isOn[i] ? 'ON' : 'OFF') + ' — ' + angle + '°');
    buttons[i].html(isOn[i] ? 'OFF' : 'ON'); // button shows the next action
}

function sendServo(index, angle) {
    if (!client || !client.isConnected()) {
        console.log('MQTT not connected -- message not sent');
        return false;
    }
    let message = new Paho.MQTT.Message(index + ':' + angle);
    message.destinationName = topicServo;
    client.send(message);
    console.log('sent ' + message.payloadString);
    return true;
}

function onConnect() {
    console.log('client is connected');
    statusText.html('MQTT: connected ✅');
}

function onConnectFailure(response) {
    console.log('onConnectFailure: ' + response.errorMessage);
    statusText.html('MQTT: connection failed ❌ (refresh to retry)');
}

function onConnectionLost(response) {
    if (response.errorCode !== 0) console.log('onConnectionLost: ' + response.errorMessage);
    statusText.html('MQTT: disconnected ❌ (refresh to retry)');
}