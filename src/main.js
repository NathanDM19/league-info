const socket = io.connect(window.location.host);

let champions, main, userId, summonerSpells, username, gameModes, runesReforged;
let matches;
let searchTotal = 20;
let version = "8.14.1"
$('document').ready(() => {
  username = window.location.pathname.slice(8)
  username = username.replace("%20", " ");
  main = $('#main')
  $('#searchButton').click(function (ev) {
    ev.preventDefault();
    window.location.replace(`${window.location.origin}/search/${$('#query').val()}`);
  })
});
socket.on('static', data => {
  champions = data.champions.data
  summonerSpells = data.summonerSpells.data
  gameModes = data.gameModes
  runesReforged = data.runesReforged;
  socket.emit('summoner', username)
})
socket.on('result', data => {
  console.log(data)
  userId = data.summoner.id;
  main.html('');
  main.append(`
  <div id="summonerInfo">
    <div id="summonerIconDiv">
      <img id="summonerIcon" src="http://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${data.summoner.profileIconId}.png">
    </div>
    <div id="summonerInfoDiv">
      <p id="username">${data.summoner.name}</p>
      <p id="level">Level: ${data.summoner.summonerLevel}</p>
    </div>
    <div id="rankedInfoDiv">
    </div>
    <br><br>
    <hr>
  </div>
  <div id="matchHistory">
    <p id="updateTime">Last updated ${data.update}</p>
    <button type="button" class="btn btn-primary" id="update">Update</button>
    <p id="matchHistoryText">Match History</p>
    <button type="button" class="btn btn-primary" id="liveGame">Live Game</button>
    <br><hr>
  </div>`)
  let ranked = false;
  for (let i = 0; i < data.queues.length; i++) {
    let queue = data.queues[i];
    let rank;
    switch (queue.rank) {
      case "I":
        rank = 1
        break;
      case "II":
        rank = 2;
        break;
      case "III":
        rank = 3;
        break;
      case "IV":
        rank = 4;
        break;
      case "V":
        rank = 5;
        break;
    }
    if (queue.queueType === "RANKED_SOLO_5x5") {
      ranked = true;
      $('#rankedInfoDiv').append(`
      <img id="rankedImage" src="http://opgg-static.akamaized.net/images/medals/${queue.tier.toLowerCase()}_${rank}.png">
      <div id="rankedText">
      <p class="rankedText">${queue.tier[0] + queue.tier.slice(1).toLowerCase()} ${rank}</p>
      <p class="rankedText">${queue.leaguePoints} LP</p>
      <p class="rankedText">${queue.wins}W / ${queue.losses}L</p>
      <p class="rankedText">${Math.round(queue.wins / (queue.wins + queue.losses) * 100)}% Win Ratio</p>
      <p class="rankedText">${queue.leagueName}</p>
      </div>
      `)
    }
  }
  if (!ranked) {
    $('#rankedInfoDiv').append(`
      <img id="rankedImage" src="http://opgg-static.akamaized.net/images/medals/default.png">
      <div id="rankedText">
      <p class="unrankedText">Unranked</p>
      </div>
      `)
  }
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
      socket.emit('match', { id: match.gameId, champion, username, count: i, searchTotal });
    }
  }
})
socket.on('allMatch', data => {
  function compare(a, b) {
    if (a.results.gameCreation < b.results.gameCreation)
      return -1;
    if (a.results.gameCreation > b.results.gameCreation)
      return 1;
    return 0;
  }
  data.sort(compare).reverse();
  matches = data
  for (let i = 0; i < data.length; i++) {
    console.log(data[i].results)
    let win, userInfo;
    let summonerNames = { 1: [], 2: [] };
    let summonerInfo = { 1: [], 2: [] };
    let items = 0;
    let extraInfo = false;
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
      <div class="mainInfo">
        <div class="match1">
          <img class="championIcon" src="http://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${data[i].results.champion}.png">
        </div>
        <div class="summonerSpells">
          <img class="summonerSpell" src="http://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${userInfo.spell1}.png">
          <img class="summonerSpell" src="http://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${userInfo.spell2}.png">
        </div>
        <div class="runes" id="${data[i].results.gameId}Runes">
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
          <img class="item" src="http://ddragon.leagueoflegends.com/cdn/${version}/img/item/${userInfo.stats.item6}.png">
        </div>
        <div class="matchExtra">
          <p class="extraText gameMode">${gameModes[data[i].results.queueId]}</p>
          <p class="extraText gameLength">${Math.floor(data[i].results.gameDuration / 60)}m ${data[i].results.gameDuration % 60}s</p>
          <p class="extraText gameLevel">Level ${userInfo.stats.champLevel}</p>
          <p class="extraText damageDealt">Damage Dealt: ${userInfo.stats.totalDamageDealtToChampions.toString().slice(0, -3)},${userInfo.stats.totalDamageDealtToChampions.toString().slice(-3)}</p>
          <p class="extraText sinceGame">${data[i].results.ago}</p>
        </div>
        <div class="moreInfo">
          <div id="${data[i].results.gameId}moreInfo" class="downArrow"></div>
        </div> 
        <div id="${data[i].results.gameId}SummonersLeft" class="matchSummoners"></div>
        <div id="${data[i].results.gameId}ChampsLeft" class="matchSummonerChamps"></div>
        <div id="${data[i].results.gameId}SummonersRight" class="matchSummoners"></div>
        <div id="${data[i].results.gameId}ChampsRight" class="matchSummonerChamps"></div>
      </div>
      <div class="belowDiv" id="${data[i].results.gameId}BelowDiv">
      </div>
    </div>`)
    // Runes
    for (let j = 0; j < runesReforged.length; j++) {
      for (let k = 0; k < runesReforged[j].slots[0].runes.length; k++) {
        if (runesReforged[j].slots[0].runes[k].id == userInfo.stats.perk0) {
          $(`#${data[i].results.gameId}Runes`).append(`<img class="rune" src="https://ddragon.leagueoflegends.com/cdn/img/${runesReforged[j].slots[0].runes[k].icon}">`);
          break;
        }
      }
    }
    for (let j = 0; j < runesReforged.length; j++) {
      if (runesReforged[j].id == userInfo.stats.perkSubStyle) {
        $(`#${data[i].results.gameId}Runes`).append(`<img class="rune" src="https://ddragon.leagueoflegends.com/cdn/img/${runesReforged[j].icon}">`);
        break;
      } 
    }
    // Items
    for (let j = 0; j < 6; j++) {
      if (userInfo.stats[`item${j}`] != 0) {
        let itemId = userInfo.stats[`item${j}`];
        $(`#${data[i].results.gameId}Items`).append(`<img class="item" src="http://ddragon.leagueoflegends.com/cdn/${version}/img/item/${itemId}.png">`)
        items++;
      }
    }
    for (let j = 6; j > items; j--) {
      $(`#${data[i].results.gameId}Items`).append(`<div class="emptyItem"></div>`)
    }
    // Team 1 players
    for (let j = 0; j < summonerNames[1].length; j++) {
      $(`#${data[i].results.gameId}SummonersLeft`).append(`<p class="playerName">${summonerNames[1][j]}</p>`)
      let champion;
      for (key in champions) {
        if (champions[key].key == summonerInfo[1][j].championId) {
          champion = champions[key].id
          break;
        }
      }
      $(`#${data[i].results.gameId}ChampsLeft`).append(`<img class="playerChamp" src="http://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champion}.png">`)
    }

    // Team 2 players
    for (let j = 0; j < summonerNames[2].length; j++) {
      $(`#${data[i].results.gameId}SummonersRight`).append(`<p class="playerName">${summonerNames[2][j]}</p>`)
      let champion;
      for (key in champions) {
        if (champions[key].key == summonerInfo[2][j].championId) {
          champion = champions[key].id
          break;
        }
      }
      $(`#${data[i].results.gameId}ChampsRight`).append(`<img class="playerChamp" src="http://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champion}.png">`)
    }

    // More info button
    $(`#${data[i].results.gameId}moreInfo`).click(() => {
      console.log(data[i].results.gameId)
      if (!extraInfo) {
        $(`#${data[i].results.gameId}`).css({ height: '617px', borderRadius: '0' })
        $(`#${data[i].results.gameId}moreInfo`).css({transform: "rotate(180deg)"})
        $(`#${data[i].results.gameId}BelowDiv`).css({ display: "block" })
      } else {
        $(`#${data[i].results.gameId}`).css({ height: '130px', borderRadius: '20px' })
        $(`#${data[i].results.gameId}moreInfo`).css({ transform: "rotate(0deg)" })
        $(`#${data[i].results.gameId}BelowDiv`).css({ display: "none" })
      }
      extraInfo = !extraInfo;
    })

    // Extra Info
    $(`#${data[i].results.gameId}BelowDiv`).append(`
    <div class="blueTeam">
      <div class="teamName">
        Blue Team
      </div>
      <div class="itemsName">
        Items
      </div>
      <div class="kdaName">
        KDA
      </div>
      <div class="damageName">
        Damage
      </div>
      <div class="goldName">
        Gold
      </div>
      <div class="tierName">
      </div>
    </div>
    `)
    // Getting champion names
    for (let j = 0; j < data[i].results.participants.length; j++) {
      if (j === data[i].results.participants.length / 2) {
        $(`#${data[i].results.gameId}BelowDiv`).append(`
        <div class="blueTeam">
          <div class="teamName">
            Red Team
          </div>
          <div class="itemsName">
            Items
          </div>
          <div class="kdaName">
            KDA
          </div>
          <div class="damageName">
            Damage
          </div>
          <div class="goldName">
            Gold
          </div>
          <div class="tierName">
          </div>
        </div>
        `)
      }
      let player = data[i].results.participants[j];
      let champ;
      let items = 0;
      for (key in champions) {
        if (player.championId == champions[key].key) {
          champ = key;
          break;
        }
      }
      // Getting Summoner Spells
      for (key in summonerSpells) {
        if (summonerSpells[key].key == player.spell1Id) {
          player.spell1 = key;
        } else if (summonerSpells[key].key == player.spell2Id) {
          player.spell2 = key;
        }
      }
      // Getting Runes
      for (let j = 0; j < runesReforged.length; j++) {
        for (let k = 0; k < runesReforged[j].slots[0].runes.length; k++) {
          if (runesReforged[j].slots[0].runes[k].id == player.stats.perk0) {
            player.rune1 = runesReforged[j].slots[0].runes[k].icon
            break;
          }
        }
      }
      for (let j = 0; j < runesReforged.length; j++) {
        if (runesReforged[j].id == player.stats.perkSubStyle) {
          player.rune2 = runesReforged[j].icon
          break;
        }
      }
      $(`#${data[i].results.gameId}BelowDiv`).append(`
      <div class="player">
        <div class="playerChampion">
          <img class="playerChampionIcon" src="http://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champ}.png">
        </div>
        <div class="playerSpells">
          <img class="playerSpell" src="http://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${player.spell1}.png">
          <img class="playerSpell playerSpell2" src="http://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${player.spell2}.png">
        </div>
        <div class="playerRunes">
          <img class="playerRune" src="https://ddragon.leagueoflegends.com/cdn/img/${player.rune1}">
          <img class="playerRune playerRune2" src="https://ddragon.leagueoflegends.com/cdn/img/${player.rune2}">
        </div>
        <div class="playerUsername">
          ${data[i].results.participantIdentities[j].player.summonerName}
        </div>
        <div class="playerItems" id="${data[i].results.gameId}${player.championId}">
        </div>
        <div class="playerKDA">
          <p class="margin0">${parseFloat((player.stats.kills + player.stats.assists) / player.stats.deaths).toFixed(2)}:1</p>
          <p class="margin0 playerScore">${player.stats.kills} / ${player.stats.deaths} / ${player.stats.assists}</p>
        </div>
        <div class="playerDamage">
          ${player.stats.totalDamageDealtToChampions.toString().slice(0, -3)},${player.stats.totalDamageDealtToChampions.toString().slice(-3)}
        </div>
        <div class="playerGold">
          ${player.stats.goldEarned.toString().slice(0, -3)},${player.stats.goldEarned.toString().slice(-3)}
        </div>
      </div>
      `)
      // Items
      for (let j = 0; j < 6; j++) {
        if (player.stats[`item${j}`] != 0) {
          let itemId = player.stats[`item${j}`];
          $(`#${data[i].results.gameId}${player.championId}`).append(`<img class="item" src="http://ddragon.leagueoflegends.com/cdn/${version}/img/item/${itemId}.png">`)
          items++;
        }
      }
      for (let j = 6; j > items; j--) {
        $(`#${data[i].results.gameId}${player.championId}`).append(`<div class="emptyItem"></div>`)
      }
      $(`#${data[i].results.gameId}${player.championId}`).append(`
      <img class="item" src="http://ddragon.leagueoflegends.com/cdn/${version}/img/item/${player.stats.item6}.png">`);
    }
  }
  $('#update').click(function () {
    socket.emit('clear', username);
    socket.emit('summoner', username);
  })
})