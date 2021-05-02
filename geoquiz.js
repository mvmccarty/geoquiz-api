const citiesFilePath = 'uscities.csv';
const zipsFilePath = 'uszips.json';
const csv = require('csvtojson');
const fs = require('fs');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const morgan = require('morgan');
const cors = require('cors');

const express = require('express');
const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(morgan('tiny'));
app.use(cors());

var usCitiesData;
var zipCodeData;


// Import US Cities Data Set
csv()
.fromFile(citiesFilePath)
.then((jsonObj)=>{

	usCitiesData = jsonObj;

});


// Import Zip Code Data Set
fs.readFile(zipsFilePath, 'utf8', (err, data) => {

	if (err) { console.log(err) }

	zipCodeData = data;

});




// http://localhost:3000/api/getCitiesWithinZipCodeRadius?zipCode=98101&kmRadius=45

app.post('/api/getCitiesWithinZipCodeRadius', (req, res) => {

  console.log(req.body);

	console.log('API Call - getCitiesWithinZipCodeRadius');

  // console.log(req.query);

	var zipMatch = JSON.parse(zipCodeData).find(element => element.fields.zip === req.body.zipCode);

    var count = 0;
    var cityNames = [];
    usCitiesData.forEach(city => {

    	if (calcCrow(city, zipMatch.fields) < Number(req.body.kmRadius) * 1000 && city.city !== zipMatch.fields.city) {
    		++count;
    		cityNames.push(city.city + ", " + city.state_id);
    	}

    });

    res.json({
    	'kmRadius' : req.body.kmRadius,
    	'zipCode' : req.body.zipCode,
    	'cityMatch' : zipMatch.fields.city + ", " + zipMatch.fields.state,
    	'citiesCount' : count,
    	'cities' : cityNames
    });

});

// http://localhost:3000/api/getCitiesWithinState?stateCode=NC

app.post('/api/getCitiesWithinState', (req, res) => {

  var stateCode = String(req.body.stateCode).trim().toUpperCase();

	console.log('API Call - getCitiesWithinState - ' + stateCode);

  var count = 0;
  var cityNames = [];
  usCitiesData.forEach(city => {

    if (city.state_id === stateCode || stateCode === "USA") {
      ++count;
      cityNames.push(city.city + ", " + city.state_id);
    }

  });

  res.json({
    'stateCode' : stateCode,
    'citiesCount' : count,
    'cities' : cityNames
  });


});




// http://localhost:3000/api/getGameSessions
app.get('/api/getGameSessions', (req, res) => {

  let rawdata = fs.readFileSync('scores.json');
  let scoresList = JSON.parse(rawdata);

  console.log('API Call - getGameSessions - ' + scoresList.scores.length + ' results.');

  res.json(scoresList);
});


// http://localhost:3000/api/postGameSession
app.post('/api/postGameSession', (req, res) => {

  console.log('API Call - postGameSession');

  let rawdata = fs.readFileSync('scores.json');
  let scoresList = JSON.parse(rawdata);

  let newGameSession = {};
  newGameSession['id'] = uuidv4();
  [ 'citiesCount',
    'playerName',
    'gameTime',
    'rounds',
    'score',
    'quizMinutes'].forEach(param => {
      newGameSession[param] = req.body[param];
    });


  if (req.body.gameOptions.quizType === "zipCodeRadius") {
    newGameSession.quizOptions = {
      "quizType" : req.body.gameOptions.quizType,
      "zipCode" : req.body.gameOptions.zipCode,
      "kmRadius" : req.body.gameOptions.kmRadius,
      "cityMatch" : req.body.gameOptions.cityMatch,
    }

  } else if (req.body.gameOptions.quizType === "entireState") {
    newGameSession.quizOptions = {
      "quizType" : req.body.gameOptions.quizType,
      "stateCode" : req.body.gameOptions.stateCode
    }

  }


  scoresList['scores'].push(newGameSession);
  scoresList = JSON.stringify(scoresList);

  fs.writeFile('scores.json', scoresList, (err) => {

    if (err) throw err;

    console.log('game session successfully recorded.');
    res.json({});

  });

});




app.listen(port, () => {
  console.log(`app listening at http://localhost:${port}`)
})




function calcCrow(coords1, coords2)
{
  // var R = 6.371; // km
  var R = 6371000;
  var dLat = toRad(coords2.latitude-coords1.lat);
  var dLon = toRad(coords2.longitude-coords1.lng);
  var lat1 = toRad(coords1.lat);
  var lat2 = toRad(coords2.latitude);

  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c;
  return d;
}

// Converts numeric degrees to radians
function toRad(Value)
{
    return Value * Math.PI / 180;
}
