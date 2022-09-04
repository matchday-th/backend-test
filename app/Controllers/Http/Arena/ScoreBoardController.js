'use strict'

const ScoreBoard = use("App/Models/ScoreBoard");
const ScoreBoardModule = require('../ScoreBoardModule.js');

class ScoreBoardController {
    async score_board({response, auth, params}){
        try{
            const sp = await auth.getUser()
            const score_board = await ScoreBoardModule.GetOrCreate.show_score(sp.id, params.month)
             response.send(score_board)
         }catch(err){
             response.send(err)
         }
    }
}

module.exports = ScoreBoardController
