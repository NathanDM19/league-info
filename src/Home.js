$('document').ready(() => {
  $('#searchButton').click(() => {
    window.location.replace(`${window.location}search/${$('#query').val()}`)
  });
  main = $('#main')
});