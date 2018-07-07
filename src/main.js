// const socket = io.connect("http://localhost:3000");
const socket = io.connect(window.location.hostname);

let champions
let main;
$('document').ready(() => {
  $('#searchButton').click(() => {
    socket.emit('summoner', $('#query').val());
  });
  main = $('#main')
  // console.log(champions)
  // $.getJSON('champions.json', json => {
  //   console.log(json)
  // })
})
socket.on('champions', data => {
  champions = data.data;
})
socket.on('result', data => {

  main.append(`<p>Username: ${data.summoner.name}</p><p>Account Level: ${data.summoner.summonerLevel}</p><img id="summonerIcon" src="http://ddragon.leagueoflegends.com/cdn/8.13.1/img/profileicon/${data.summoner.profileIconId}.png"><br><br><div id="matchHistory">Match History<br><br><hr></div>`)
  for (let i = 0; i < data.matchHistory.matches.length; i++) {
    let match = data.matchHistory.matches[i]
    let champion;
    for (key in champions) {
      if (champions[key].key == match.champion) {
        champion = champions[key].id;
      }
  }
    $('#matchHistory').append(`<div id="${match.gameId}"><p>Champion: ${champion}</p><p>Role: ${match.role} <button id="button${match.gameId}"class="info">More Info</button></p></div><hr>`)
    $(`#button${match.gameId}`).click(() => {
      socket.emit('match', match.gameId);
    })
  }
  console.log(data)
})

socket.on('match', data => {
  console.log(data)
  $(`#${data.match.gameId}`).append(`<p>Game Mode: ${data.match.gameMode}</p>`)
})