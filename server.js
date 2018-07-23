const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const ta = require('./node_modules/time-ago/timeago.js')
const tstd = require('./node_modules/timestamp-to-date/lib/index.js')
const champions = require('./src/champions.json')
const summonerSpells = require('./src/summonerSpells.json')
const gameModes = require('./src/gameModes.json')
const runesReforged = require('./src/runesReforged.json')
const keys = require('./src/keys.json')
const PORT = process.env.PORT || 3000;
const League = require('leaguejs')
process.env.LEAGUE_API_KEY = keys.riot
const api = new League(process.env.LEAGUE_API_KEY, {
  PLATFORM_ID: "oc1",
  limits: { allowBursts: true }
})
//https://oc1.api.riotgames.com/lol/summoner/v3/summoners/by-name/Cre?api_key=RGAPI-30a650bc-20a5-4619-8cb4-cccddf0c906b

// Mongoose
const mongodb = require('mongodb');
// const uristring = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/HelloMongoose';
const uristring = keys.mongo
let db, userDB;
mongodb.MongoClient.connect(uristring, function (err, client) {
  if (err) {
    console.log ('ERROR connecting to: ' + uristring + '. ' + err);
  } else {
    console.log ('Connected to database!');
    db = client.db('heroku_nv706h5q')
    userDB = db.collection('userDB')
  }
});

app.use(express.static('src'));

// ROUTES
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/src/index.html")
  console.log("ROOT")
});
app.get("/search/:name", (req, res) => {
  res.sendFile(__dirname + "/src/users.html")
  // res.send(req.params.name)
})


server.listen(PORT, () => {
  console.log(`Webserver listening on port ${PORT}`);
})
io.on('connection', socket => {
  console.log("user connected")
  // Summoner Search
  let userDBinfo = {};
  let userMatches = [];
  let totalMatches = 0;
  socket.emit('static', {champions, summonerSpells, gameModes, runesReforged})
  socket.on('summoner', summoner => {
    let results = {};
    if (userDB) {
      userDB
        .find({ username: summoner.toLowerCase() })
        .toArray((err, res) => {
          if (res[0]) {
            res[0].db = true;
            res[0].update = ta.ago(res[0].date)
            for (let i = 0; i < res[0].matches.length; i++) {
              res[0].matches[i].results.ago = ta.ago(tstd((res[0].matches[i].results.gameCreation + (res[0].matches[i].results.gameDuration * 1000)), 'yyyy-MM-dd HH:mm:ss'))
            }
            socket.emit('result', res[0])
            userMatches = res[0].matches;
            socket.emit('allMatch', res[0].matches)
          } else {
            console.log("Running API search")
            api.Summoner.gettingByName(summoner).then(data => {
              results.summoner = data
              api.League.gettingPositionsForSummonerId(results.summoner.id).then(data => {
                results.queues = data
                api.Match.gettingListByAccount(results.summoner.accountId).then(data => {
                  results.matchHistory = data;
                  results.update = "a few seconds ago"
                  userDBinfo = {
                    "username": summoner.toLowerCase(),
                    "summoner": results.summoner,
                    "matchHistory": { "matches": data.matches },
                    "matches": [],
                    "date": new Date(),
                    "queues": results.queues
                  }
                  socket.emit('result', results)
                })
                  .catch(err => {
                    console.log("2nd Error:", err)
                  })
              })
            })
              .catch(err => {
              console.log("Error:",err)
            })
          }
        })
    }
  })

  // Match search
  socket.on('match', data => {
    let results = {};
    let champion = data.champion;
    let count = data.count;
    let searchTotal = data.searchTotal;
    let upToDate = false;
    api.Match.gettingById(data.id).then(data => {
      results = data;
      results.champion = champion;
      results.ago = ta.ago(tstd((results.gameCreation + (results.gameDuration * 1000)), 'yyyy-MM-dd HH:mm:ss'))
      totalMatches++;
      if (userMatches.length) {
        for (let i = 0; i < userMatches.length; i++) {
          if (userMatches[i].results.gameId === results.gameId) {
            break;
          }
          if (i === userMatches.length - 1) {
            userMatches.push({ results });
            break;
          }
        }
      } else {
        userMatches.push({ results });
      }
      if (totalMatches === searchTotal - 1) {
          userDB.insert({
            "username": userDBinfo.username,
            "summoner": userDBinfo.summoner,
            "matchHistory": userDBinfo.matchHistory,
            "matches": userMatches,
            "date": userDBinfo.date,
            "queues": userDBinfo.queues
          })
        for (let i = 0; i < userMatches.length; i++) {
          userMatches[i].results.ago = ta.ago(tstd((userMatches[i].results.gameCreation + (userMatches[i].results.gameDuration) * 1000), 'yyyy-MM-dd HH:mm:ss'))
        }
        socket.emit('allMatch', userMatches)
        }
    })
  })
  // New Search
  socket.on('clear', username => {
    totalMatches = 0; 
    userDB.remove(
      { username: username.toLowerCase() }
    )
  })
});