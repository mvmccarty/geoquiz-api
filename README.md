# geoquiz-server
API server for geoquiz project

## api/getCitiesWithinZipCodeRadius
    `POST`
   **Required:**
   `zipCode=[integer]`
   `kmRadius=[integer]`

## /api/getCitiesWithinState
    `POST`
    **Required:**
    `stateCode=[string]`

## /api/getGameSessions
    `GET`

## /api/postGameSession
    `POST`
    **Required:**
    `citiesCount=[integer]`
    `playerName=[string]`
    `gameTime=[string]`
    `rounds=[integer]`
    `score=[integer]`
    `quizMinutes=[integer]`
    `gameOptions=[array]`
