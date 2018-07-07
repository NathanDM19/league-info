// const socket = io.connect("http://localhost:3000");
const socket = io.connect(window.location.hostname);

let champions, main, userId, summonerSpells;
let searchTotal = 20;
$('document').ready(() => {
  $('#searchButton').click(() => {
    socket.emit('summoner', $('#query').val());
  });
  main = $('#main')
});
socket.on('mongoose', data => {
  console.log("Connected to " + data);
});
socket.on('static', data => {
  champions = data.champions.data
  summonerSpells = data.summonerSpells.data
})
socket.on('result', data => {
  userId = data.summoner.id;
  main.append(`
  <div id="summonerInfo">
    <div id="summonerIconDiv">
      <img id="summonerIcon" src="http://ddragon.leagueoflegends.com/cdn/8.13.1/img/profileicon/${data.summoner.profileIconId}.png">
    </div>
    <div id="summonerInfoDiv">
      <p id="username">${data.summoner.name}</p>
      <p id="level">Level: ${data.summoner.summonerLevel}</p>
    </div>
    <br><br>
  </div>
  <div id="matchHistory">
    <p id="matchHistoryText">Match History</p>
    <br><hr>
  </div>`)
  for (let i = searchTotal - 20; i < searchTotal; i++) {
    let match = data.matchHistory.matches[i]
    let champion;
    for (key in champions) {
      if (champions[key].key == match.champion) {
        champion = champions[key].id;
        break;
      }
    }
    socket.emit('match', { id: match.gameId, champion });
  }
  console.log(data)
})

socket.on('match', data => {
  console.log(data)
  let win, userInfo;
  let summonerNames = { 1: [], 2: [] };
  let summonerInfo = { 1: [], 2: [] };
  // Win / loss Check
  for (let i = 0; i < data.participantIdentities.length; i++) {
    let user = data.participantIdentities[i]
    if (user.player.summonerId === userId) {
      userInfo = data.participants[i];
      let teamId = data.participants[i].teamId
      for (let i = 0; i < data.teams.length; i++) {
        if (teamId === data.teams[i].teamId) {
          win = data.teams[i].win
          break;
        }
      }
      break;
    }
  }
  // Fetching summoner icons
  for (key in summonerSpells) {
    if (summonerSpells[key].key == userInfo.spell1Id) {
      userInfo.spell1 = key;
    } else if (summonerSpells[key].key == userInfo.spell2Id) {
      userInfo.spell2 = key;
    }
  }
  console.log(userInfo)
  // Assigning users to teams
  for (let i = 0; i < data.participantIdentities.length; i++) {
    if (data.participants[i].teamId == 100) {
      summonerNames[1].push(data.participantIdentities[i].player.summonerName)
      summonerInfo[1].push(data.participants[i])
    } else {
      summonerNames[2].push(data.participantIdentities[i].player.summonerName)
      summonerInfo[2].push(data.participants[i])
    }
  }
  // Match div
  $('#matchHistory').append(`
  <div class="match ${win}" id="${data.gameId}">
    <div class="match1">
      <img class="championIcon" src="http://ddragon.leagueoflegends.com/cdn/8.13.1/img/champion/${data.champion}.png">
    </div>
    <div class="summonerSpells">
      <img class="summonerSpell" src="http://ddragon.leagueoflegends.com/cdn/8.13.1/img/spell/${userInfo.spell1}.png">
      <img class="summonerSpell" src="http://ddragon.leagueoflegends.com/cdn/8.13.1/img/spell/${userInfo.spell2}.png">
    </div>
    <div class="matchScore">
      <p class="championName">${champions[data.champion].name}</p>
      <p class="score">${userInfo.stats.kills} / ${userInfo.stats.deaths} / ${userInfo.stats.assists}</p>
      <p class="kda" >
        ${parseFloat((userInfo.stats.kills + userInfo.stats.assists) / userInfo.stats.deaths).toFixed(2)}:1 KDA
      </p>
    </div>
    <div id="${data.gameId}Items" class="matchItems">
    </div>
    <div class="matchTrinket">
      <img class="item" src="http://ddragon.leagueoflegends.com/cdn/8.13.1/img/item/${userInfo.stats.item6}.png">
    </div>
    <div id="${data.gameId}summonersLeft" class="matchSummoners"></div>
    <div id="${data.gameId}ChampsLeft" class="matchSummonerChamps"></div>
    <div id="${data.gameId}summonersRight" class="matchSummoners"></div>
    <div id="${data.gameId}ChampsRight" class="matchSummonerChamps"></div>
  </div>`)
  // Items
  for (let i = 0; i < 6; i++) {
    if (userInfo.stats[`item${i}`] != 0) {
      let itemId = userInfo.stats[`item${i}`];
      $(`#${data.gameId}Items`).append(`<img class="item" src="http://ddragon.leagueoflegends.com/cdn/8.13.1/img/item/${itemId}.png">`)
    }
  }
  // Team 1 players
  for (let i = 0; i < summonerNames[1].length; i++) {
    $(`#${data.gameId}summonersLeft`).append(`<p class="playerName">${summonerNames[1][i]}</p>`)
    let champion;
    for (key in champions) {
      if (champions[key].key == summonerInfo[1][i].championId) {
        champion = champions[key].id
        break;
      }
    }
    $(`#${data.gameId}ChampsLeft`).append(`<img class="playerChamp" src="http://ddragon.leagueoflegends.com/cdn/8.13.1/img/champion/${champion}.png">`)
  }

  // Team 2 players
  for (let i = 0; i < summonerNames[2].length; i++) {
    $(`#${data.gameId}summonersRight`).append(`<p class="playerName">${summonerNames[2][i]}</p>`)
    let champion;
    for (key in champions) {
      if (champions[key].key == summonerInfo[2][i].championId) {
        champion = champions[key].id
        break;
      }
    }
    $(`#${data.gameId}ChampsRight`).append(`<img class="playerChamp" src="http://ddragon.leagueoflegends.com/cdn/8.13.1/img/champion/${champion}.png">`)
  }

  // More info button
  $(`#button${data.gameId}`).click(() => {
    console.log(data.gameId)
  })
})