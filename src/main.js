// const socket = io.connect("http://localhost:3000");
const socket = io.connect(window.location.hostname);

let champions, main, userId;
let searchTotal = 20;
$('document').ready(() => {
  $('#searchButton').click(() => {
    socket.emit('summoner', $('#query').val());
  });
  main = $('#main')
})
socket.on('champions', data => {
  champions = data.data;
})
socket.on('result', data => {
  userId = data.summoner.id;
  main.append(`<p>Username: ${data.summoner.name}</p><p>Account Level: ${data.summoner.summonerLevel}</p><img id="summonerIcon" src="http://ddragon.leagueoflegends.com/cdn/8.13.1/img/profileicon/${data.summoner.profileIconId}.png"><br><br><div id="matchHistory">Match History<br><br><hr></div>`)
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
  for (let i = 0; i < data.match.participantIdentities.length; i++) {
    let user = data.match.participantIdentities[i]
    if (user.player.summonerId === userId) {
      userInfo = data.match.participants[i];
      let teamId = data.match.participants[i].teamId
      for (let i = 0; i < data.match.teams.length; i++) {
        if (teamId === data.match.teams[i].teamId) {
          win = data.match.teams[i].win
          break;
        }
      }
      break;
    }
  }
  // Assigning users to teams
  for (let i = 0; i < data.match.participantIdentities.length; i++) {
    if (data.match.participants[i].teamId == 100) {
      summonerNames[1].push(data.match.participantIdentities[i].player.summonerName)
      summonerInfo[1].push(data.match.participants[i])
    } else {
      summonerNames[2].push(data.match.participantIdentities[i].player.summonerName)
      summonerInfo[2].push(data.match.participants[i])
    }
  }
  $('#matchHistory').append(`
  <div class="match ${win}" id="${data.match.gameId}">
    <div class="match1">
      <p class="champName" >${data.champion}</p>
      <img class="championIcon" src="http://ddragon.leagueoflegends.com/cdn/8.13.1/img/champion/${data.champion}.png">
    </div>
    <div class="matchScore">
      <p class="score">${userInfo.stats.kills} / ${userInfo.stats.deaths} / ${userInfo.stats.assists}</p>
    </div>
    <div id="${data.match.gameId}summonersLeft" class="matchSummoners"></div>
    <div id="${data.match.gameId}ChampsLeft" class="matchSummonerChamps"></div>
    <div id="${data.match.gameId}summonersRight" class="matchSummoners"></div>
    <div id="${data.match.gameId}ChampsRight" class="matchSummonerChamps"></div>
  </div>`)
  for (let i = 0; i < summonerNames[1].length; i++) {
    $(`#${data.match.gameId}summonersLeft`).append(`<p class="playerName">${summonerNames[1][i]}</p>`)
    let champion;
    for (key in champions) {
      if (champions[key].key == summonerInfo[1][i].championId) {
        champion = champions[key].id
        break;
      }
    }
    $(`#${data.match.gameId}ChampsLeft`).append(`<img class="playerChamp" src="http://ddragon.leagueoflegends.com/cdn/8.13.1/img/champion/${champion}.png">`)
  }
  for (let i = 0; i < summonerNames[2].length; i++) {
    $(`#${data.match.gameId}summonersRight`).append(`<p class="playerName">${summonerNames[2][i]}</p>`)
    let champion;
    for (key in champions) {
      if (champions[key].key == summonerInfo[2][i].championId) {
        champion = champions[key].id
        break;
      }
    }
    $(`#${data.match.gameId}ChampsRight`).append(`<img class="playerChamp" src="http://ddragon.leagueoflegends.com/cdn/8.13.1/img/champion/${champion}.png">`)
  }
  $(`#button${data.match.gameId}`).click(() => {
    console.log(data.match.gameId)
  })
})