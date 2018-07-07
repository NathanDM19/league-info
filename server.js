const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const champions = require('./src/champions.json')
const summonerSpells = require('./src/summonerSpells.json')
const PORT = process.env.PORT || 3000;
const League = require('leaguejs')
process.env.LEAGUE_API_KEY = "RGAPI-30a650bc-20a5-4619-8cb4-cccddf0c906b"
const api = new League(process.env.LEAGUE_API_KEY, { PLATFORM_ID: "oc1" })
//https://oc1.api.riotgames.com/lol/summoner/v3/summoners/by-name/Cre?api_key=RGAPI-30a650bc-20a5-4619-8cb4-cccddf0c906b

// Mongoose
const mongoose = require('mongoose');
const uristring = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/HelloMongoose';
mongoose.connect(uristring, function (err, res) {
  if (err) {
    console.log ('ERROR connecting to: ' + uristring + '. ' + err);
    setInterval(function() {
      io.emit('mongoose', {uristring, err})
    }, 1000)
  } else {
    console.log ('Succeeded connected to: ' + uristring);
    setInterval(function() {
      io.emit('mongoose', uristring)
    }, 2000)
  }
});

app.use(express.static('src'));
server.listen(PORT, () => {
  console.log(`Webserver listening on port ${PORT}`);
})
io.on('connection', socket => {
  console.log("user connected")
  // Summoner Search
  socket.emit('static', {champions, summonerSpells})
  socket.on('summoner', summoner => {
    let results = {};
    api.Summoner.gettingByName(summoner).then(data => {
      results.summoner = data
      api.Match.gettingListByAccount(data.accountId).then(data => {
        results.matchHistory = data
        socket.emit('result', results)
      })
    })
  });
  // Match search
  socket.on('match', data => {
    let results = {};
    let champion = data.champion;
    api.Match.gettingById(data.id).then(data => {
      results = data;
      results.champion = champion;
      socket.emit('match', results)
    })
  })
});