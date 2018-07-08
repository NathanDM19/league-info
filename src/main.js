// const socket = io.connect("http://localhost:3000");
const socket = io.connect(window.location.hostname);

let champions, main, userId, summonerSpells, username, gameModes;
let searchTotal = 20;
$('document').ready(() => {
  username = window.location.pathname.slice(8)
  main = $('#main')
});
socket.on('static', data => {
  champions = data.champions.data
  summonerSpells = data.summonerSpells.data
  gameModes = data.gameModes
  socket.emit('summoner', username)
})
socket.on('result', data => {
  console.log(data)
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
  if (!data.db) {
    for (let i = searchTotal - 20; i < searchTotal; i++) {
      let match = data.matchHistory.matches[i]
      let champion;
      for (key in champions) {
        if (champions[key].key == match.champion) {
          champion = champions[key].id;
          break;
        }
      }
      socket.emit('match', { id: match.gameId, champion, username, count: i });
    }
  }
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
  console.log(userInfo)
  for (key in summonerSpells) {
    if (summonerSpells[key].key == userInfo.spell1Id) {
      userInfo.spell1 = key;
    } else if (summonerSpells[key].key == userInfo.spell2Id) {
      userInfo.spell2 = key;
    }
  }
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
    <div class="matchExtra">
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
socket.on('allMatch', data => {
  for (let i = 0; i < data.length; i++) {
    console.log(data[i].results)
    let win, userInfo;
    let summonerNames = { 1: [], 2: [] };
    let summonerInfo = { 1: [], 2: [] };
    // Win / loss Check
    for (let j = 0; j < data[i].results.participantIdentities.length; j++) {
      let user = data[i].results.participantIdentities[j]
      if (user.player.summonerId === userId) {
        userInfo = data[i].results.participants[j];
        let teamId = data[i].results.participants[j].teamId
        for (let k = 0; k < data[i].results.teams.length; k++) {
          if (teamId === data[i].results.teams[k].teamId) {
            win = data[i].results.teams[k].win
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
    // Assigning users to teams
    for (let j = 0; j < data[i].results.participantIdentities.length; j++) {
      if (data[i].results.participants[j].teamId == 100) {
        summonerNames[1].push(data[i].results.participantIdentities[j].player.summonerName)
        summonerInfo[1].push(data[i].results.participants[j])
      } else {
        summonerNames[2].push(data[i].results.participantIdentities[j].player.summonerName)
        summonerInfo[2].push(data[i].results.participants[j])
      }
    }
    // Match div
    $('#matchHistory').append(`
    <div class="match ${win}" id="${data[i].results.gameId}">
      <div class="match1">
        <img class="championIcon" src="http://ddragon.leagueoflegends.com/cdn/8.13.1/img/champion/${data[i].results.champion}.png">
      </div>
      <div class="summonerSpells">
        <img class="summonerSpell" src="http://ddragon.leagueoflegends.com/cdn/8.13.1/img/spell/${userInfo.spell1}.png">
        <img class="summonerSpell" src="http://ddragon.leagueoflegends.com/cdn/8.13.1/img/spell/${userInfo.spell2}.png">
      </div>
      <div class="matchScore">
        <p class="championName">${champions[data[i].results.champion].name}</p>
        <p class="score">${userInfo.stats.kills} / ${userInfo.stats.deaths} / ${userInfo.stats.assists}</p>
        <p class="kda" >
          ${parseFloat((userInfo.stats.kills + userInfo.stats.assists) / userInfo.stats.deaths).toFixed(2)}:1 KDA
        </p>
      </div>
      <div id="${data[i].results.gameId}Items" class="matchItems">
      </div>
      <div class="matchTrinket">
        <img class="item" src="http://ddragon.leagueoflegends.com/cdn/8.13.1/img/item/${userInfo.stats.item6}.png">
      </div>
      <div class="matchExtra">
        <p class="extraText gameMode">${gameModes[data[i].results.queueId]}</p>
        <p class="extraText gameLength">${Math.floor(data[i].results.gameDuration / 60)}m ${data[i].results.gameDuration % 60}s</p>
        <p class="extraText gameLevel">Level ${userInfo.stats.champLevel}</p>
        <p class="extraText damageDealt">Damage Dealt: ${userInfo.stats.totalDamageDealtToChampions}</p>
      </div>
      <div id="${data[i].results.gameId}summonersLeft" class="matchSummoners"></div>
      <div id="${data[i].results.gameId}ChampsLeft" class="matchSummonerChamps"></div>
      <div id="${data[i].results.gameId}summonersRight" class="matchSummoners"></div>
      <div id="${data[i].results.gameId}ChampsRight" class="matchSummonerChamps"></div>
    </div>`)
    // Items
    for (let j = 0; j < 6; j++) {
      if (userInfo.stats[`item${j}`] != 0) {
        let itemId = userInfo.stats[`item${j}`];
        $(`#${data[i].results.gameId}Items`).append(`<img class="item" src="http://ddragon.leagueoflegends.com/cdn/8.13.1/img/item/${itemId}.png">`)
      }
    }
    // Team 1 players
    for (let j = 0; j < summonerNames[1].length; j++) {
      $(`#${data[i].results.gameId}summonersLeft`).append(`<p class="playerName">${summonerNames[1][j]}</p>`)
      let champion;
      for (key in champions) {
        if (champions[key].key == summonerInfo[1][j].championId) {
          champion = champions[key].id
          break;
        }
      }
      $(`#${data[i].results.gameId}ChampsLeft`).append(`<img class="playerChamp" src="http://ddragon.leagueoflegends.com/cdn/8.13.1/img/champion/${champion}.png">`)
    }

    // Team 2 players
    for (let j = 0; j < summonerNames[2].length; j++) {
      $(`#${data[i].results.gameId}summonersRight`).append(`<p class="playerName">${summonerNames[2][j]}</p>`)
      let champion;
      for (key in champions) {
        if (champions[key].key == summonerInfo[2][j].championId) {
          champion = champions[key].id
          break;
        }
      }
      $(`#${data[i].results.gameId}ChampsRight`).append(`<img class="playerChamp" src="http://ddragon.leagueoflegends.com/cdn/8.13.1/img/champion/${champion}.png">`)
    }

    // More info button
    $(`#button${data[i].results.gameId}`).click(() => {
      console.log(data[i].results.gameId)
    })
  }
})