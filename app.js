'use strict';

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const server = app.listen(process.env.PORT || 5000, () => {
  console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
});

app.get('/', (req, res) => {
  res.send('See README.md to learn how to set up your Facebook Messenger Bot');
});

/* For Facebook Validation */
app.get('/webhook', (req, res) => {
  if (req.query['hub.mode'] && req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
    res.status(200).send(req.query['hub.challenge']);
  } else {
    res.status(403).end();
  }
});

/* Handling all messenges */
app.post('/webhook', (req, res) => {
  if (req.body.object === 'page') {
    req.body.entry.forEach((entry) => {
      entry.messaging.forEach((event) => {
        if (event.message && event.message.text) {
          receivedMessage(event);
        }
      });
    });
    res.status(200).end();
  }
});

/* GET query from the Messenger */

function receivedMessage(event) {
  let sender = event.sender.id;
  let text = event.message.text;
console.log(sender, text)
  getWeatherInfoFromCityName(sender, text);
}

/* Get Weather info */

function getWeatherInfoFromCityName(sender, city) {
  let restUrl = 'http://api.openweathermap.org/data/2.5/weather?APPID='+WEATHER_API_KEY+'&q='+city;

  request.get(restUrl, (err, response, body) => {
    if (!err && response.statusCode == 200) {
      let json = JSON.parse(body);
      console.log(json);
      let tempF = ~~(json.main.temp * 9/5 - 459.67);
      let tempC = ~~(json.main.temp - 273.15);
      let msg = 'The current condition in ' + json.name + ' is ' + json.weather[0].description + ' and the temperature is ' + tempF + ' ℉ (' +tempC+ ' ℃).'
      let messageData = {
        recipient: {id: sender},
        message: {text: msg}
      };
      sendMessage(messageData);
    } else {
      let errorMessage = 'I failed to look up the city name.';
      let messageData = {
        recipient: {id: sender},
        message: {text: errorMessage}
      };
      sendMessage(messageData);
    }
  })
}

function sendMessage(messageData) {
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token: PAGE_ACCESS_TOKEN},
    method: 'POST',
    json: messageData
  }, (error, response) => {
    if (error) {
        console.log('Error sending message: ', error);
    } else if (response.body.error) {
        console.log('Error: ', response.body.error);
    }
  });
}
