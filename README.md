League Info is a website which show stats and information about players in League of Legends. You can search by a summoner name to find out information about them including their level, their rank, their ranked information and their match history.

http://league-info.herokuapp.com/search/test

# Change Log
23/07/18
- Added extra information for each match. The arrow on the right shows the extra information for that much, such as all of the players in the game, their summoner spells, runes, items, trinkets, and stats such as KDA, damage dealt to champions and gold earned.
- UI update for home page.
- UI for extra match info.

18/07/18
- Updated version to match latest.

16/07/18
- Added extended match history, from now on when updating a profile, the match history will build up rather than only show the latest 20.
- Changed the time since game to be from the end of the game, not the start of the game.
- Changed the time since game so it updates on page reload rather than on summoner update.

15/07/18
- Update button to refresh match history, this clears the database of the current summoner and saves all new data from the requests.
- Shows how long ago the last update was done. 
- UI Update.
- Ranked information for summoner, such as rank, tier, LP and league name.
- Updated match history to now always show in order of play date.
- Search bar at top of screen now rather than only on home page.
- Grey slots for no items.
- API request for match history now quicker. Originally took around 15-20 seconds for a match history, now under 5 seconds.

14/07/18
- Added database to be able to cache data, rather than having to do 23 API requests every time a page was loaded. When page loads, checks the searched summoner name in the database, if there is no entry it will do all the necessary API requests to get the information (23 requests) and then display the data. If there already is a database entry it will load that data instead, making it a lot quicker to load the page.
- Match history now also shows how long ago the game was played.

13/07/18
- Match history now also shows extra information such as queue type, match length and total damage to champions.

12/07/18
- Match history now also shows items purchased by player and trinket.

11/07/18
- Match history now also shows more information, including Win / Loss colours and other summoners in the game.

10/07/18
- Basic Match History Layout.

09/07/18
- Initial Website created.
- Show Summoner Username.
- Show Summoner Level.
- Show Summoner Icon.