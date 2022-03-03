const express = require("express");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const databasePath = path.join(__dirname, "cricketMatchDetails.db");

let database = null;
const startDBServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("The server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
  }
};

startDBServer();

const convertDBtoResponse = (dbObj) => {
  return {
    playerId: dbObj.player_id,
    playerName: dbObj.player_name,
  };
};

//API 1
app.get("/players/", async (request, response) => {
  const getPlayerQuery = `
            SELECT * FROM player_details ORDER BY player_id;`;
  const playersArr = await database.all(getPlayerQuery);
  response.send(playersArr.map((eachItem) => convertDBtoResponse(eachItem)));
});

//API 2
app.get("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const getOnePlayerQuery = `
            SELECT * FROM player_details WHERE player_id = ${playerId};`;
  const onePlayer = await database.get(getOnePlayerQuery);
  response.send(convertDBtoResponse(onePlayer));
});

//API 3
app.put("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const putOnePlayerQuery = `UPDATE player_details SET 
        player_name = '${playerName}'
        WHERE player_id = ${playerId};`;
  await database.run(putOnePlayerQuery);
  response.send("Player Details Updated");
});

const convertMatchDBToResObj = (dbObj) => {
  return {
    matchId: dbObj.match_id,
    match: dbObj.match,
    year: dbObj.year,
  };
};

//API 4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getOneMatchQuery = `
            SELECT * FROM match_details
            WHERE match_id = ${matchId}`;
  const matchDetails = await database.get(getOneMatchQuery);
  response.send(convertMatchDBToResObj(matchDetails));
});

//API 5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerOnMatchIdQuery = `
            SELECT match_id as matchId, match,year FROM match_details 
            NATURAL JOIN player_match_score
            WHERE player_id = ${playerId};`;
  const playerOnMatch = await database.all(getPlayerOnMatchIdQuery);
  response.send(playerOnMatch);
});

//API 6
app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;

  const getPlayerInSpecMatchQuery = `
            SELECT player_details.player_id as playerId,player_name as playerName
            FROM player_details NATURAL JOIN player_match_score
            WHERE player_match_score.match_id = ${matchId}`;
  const playerInSpecMatch = await database.all(getPlayerInSpecMatchQuery);
  response.send(playerInSpecMatch);
});

//API 7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerDetQuery = `
            SELECT player_details.player_id as playerId,
            player_details.player_name as playerName,
            sum(score) as totalScore,
            sum(fours) as totalFours,
            sum(sixes) as totalSixes
            FROM player_details NATURAL JOIN player_match_score
            WHERE player_id = ${playerId};`;
  const playerDet = await database.get(getPlayerDetQuery);
  response.send(playerDet);
});
module.exports = app;
