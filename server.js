const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const champions = require('./src/champions.json')
const summonerSpells = require('./src/summonerSpells.json')
const gameModes = require('./src/gameModes.json')
const PORT = process.env.PORT || 3000;
const League = require('leaguejs')
process.env.LEAGUE_API_KEY = "RGAPI-710c1a8d-602a-46bd-92c4-18d1a9c27f9a"
const api = new League(process.env.LEAGUE_API_KEY, { PLATFORM_ID: "oc1" })
//https://oc1.api.riotgames.com/lol/summoner/v3/summoners/by-name/Cre?api_key=RGAPI-30a650bc-20a5-4619-8cb4-cccddf0c906b

// Mongoose
const mongodb = require('mongodb');
// const uristring = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/HelloMongoose';
const uristring = "mongodb://nathan:annegeddes1@ds131551.mlab.com:31551/heroku_nv706h5q"
let db, userDB;
mongodb.MongoClient.connect(uristring, function (err, client) {
  if (err) {
    console.log ('ERROR connecting to: ' + uristring + '. ' + err);
  } else {
    console.log ('Succeeded connected to: ' + uristring);
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

  socket.emit('static', {champions, summonerSpells, gameModes})
  socket.on('summoner', summoner => {
    let results = {};
    if (userDB) {
      userDB
        .find({ username: summoner.toLowerCase() })
        .toArray((err, res) => {
          if (res[0]) {
            res[0].db = true;
            socket.emit('result', res[0])
            socket.emit('allMatch', res[0].matches)
          } else {
            console.log("Running API search")
            api.Summoner.gettingByName(summoner).then(data => {
              results.summoner = data
              api.Match.gettingListByAccount(data.accountId).then(data => {
                results.matchHistory = data;
                userDB.insert({
                  "username": summoner.toLowerCase(),
                  "summoner": results.summoner,
                  "matchHistory": { "matches": data.matches },
                  "matches": []
                })
                socket.emit('result', results)
              })
            })
          }
        })
    }
  })
    // api.Summoner.gettingByName(summoner).then(data => {
    //   results.summoner = data
    //   api.Match.gettingListByAccount(data.accountId).then(data => {
    //     results.matchHistory = data
    //     socket.emit('result', results)
    //   })
    // })
  // Match search
  socket.on('match', data => {
    let results = {};
    let champion = data.champion;
    let count = data.count;
    if (userDB) {
      userDB
        .find({ username: data.username.toLowerCase() })
        .toArray((err, res) => {
          // console.log(res)
          if (res[0]) {
            if (res[0].matches.length < 20) {
              api.Match.gettingById(data.id).then(data => {
                results = data;
                results.champion = champion;
                userDB.update(
                  { _id: res[0]._id },
                  { $push: { "matches": { results } } }
                )
                socket.emit('match', results)
              })
            }
          }
        })
    }
    // api.Match.gettingById(data.id).then(data => {
    //   results = data;
    //   results.champion = champion;
    //   socket.emit('match', results)
    // })
  })
});