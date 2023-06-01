const express = require("express");
const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");
const app = express();
let db = null;
app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertDetails = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDetails = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

//Get all players API
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
        SELECT * FROM player_details;
    `;
  const resultQuery = await db.all(getPlayersQuery);
  response.send(resultQuery.map((eachResult) => convertDetails(eachResult)));
});

//Get a player API
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerDetails = `
        SELECT * FROM player_details WHERE player_id = ${playerId};
    `;
  const resultQuery = await db.get(getPlayerDetails);
  response.send(convertDetails(resultQuery));
});

//Put a player API
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayer = `
        UPDATE player_details
        SET player_name = '${playerName}'
        WHERE player_id = ${playerId};
    `;
  await db.run(updatePlayer);
  response.send("Player Details Updated");
});

//Get a match Details API

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetails = `
        SELECT * FROM match_details WHERE match_id = ${matchId};
    `;
  const resultQuery = await db.get(getMatchDetails);
  response.send(convertMatchDetails(resultQuery));
});

//Get matches of a Player API
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesQuery = `
        SELECT * FROM player_match_score NATURAL JOIN match_details
        WHERE player_id = ${playerId};
    `;
  const resultQuery = await db.all(getMatchesQuery);
  response.send(
    resultQuery.map((eachObject) => convertMatchDetails(eachObject))
  );
});

//Get players of a Match API
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchesQuery = `
        SELECT * FROM player_match_score NATURAL JOIN player_details
        WHERE match_id = ${matchId};
    `;
  const resultQuery = await db.all(getMatchesQuery);
  response.send(resultQuery.map((eachObject) => convertDetails(eachObject)));
});

//Get a player Information API
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesQuery = `
        SELECT 
          player_details.player_id AS playerId,
          player_details.player_name AS playerName,
          SUM(score) AS totalScore,
          SUM(fours) AS totalFours,
          SUM(sixes) AS totalSixes
        FROM player_details INNER JOIN player_match_score ON player_details.player_id = player_match_score.player_id
        WHERE player_details.player_id = ${playerId};
    `;
  const resultQuery = await db.get(getMatchesQuery);
  response.send(resultQuery);
});

module.exports = app;
