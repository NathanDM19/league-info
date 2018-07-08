$('document').ready(() => {
  $('#searchButton').click(() => {
    window.location = `${window.location}search/${$('#query').val()}`
  });
  main = $('#main')
});