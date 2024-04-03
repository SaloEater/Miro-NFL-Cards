import {StickyNote, Text} from "@mirohq/websdk-types";
import * as React from "react";
import {Break, Round, User} from "../entities";
import "./BreakResultComponent.css"
import "./common.css"
import {useState} from "react";

class ExportEvent {
    public id = ""
    public customer = ""
    public price = 0
    public team = ""
    public is_giveaway = false
    public note = ""
    public quantity = 0
}

class ExportBreak {
    public name: string = ""
    public events: ExportEvent[] = []
    public start_date: number = 1712018062457
    public end_date: number = 1712018062457
}



function makeid(length: number) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}

export default function BreakResultComponent(props: {setCurrentRoundBreakName: (value: string) => void, breakName: string, addLog: (log: string) => void, round: Round, setRound: (roundBreaks: Round) => void, nextTeamIndex: number, setNextTeamIndex: (value: number) => void}) {
    const {setCurrentRoundBreakName, breakName, addLog, round, setRound, nextTeamIndex, setNextTeamIndex} = props
    const [wasReset, setWasReset] = useState(false)
    const [teamsAddedAmount, setTeamsAddedAmount] = useState(0)

    function setBreakName() {
        miro.board.experimental.getSelection().then((sel) => {
            sel.forEach((item, index) => {
                if (index > 0) {
                    return
                }
                let stickyNote = (item as StickyNote)
                let possibleName = (new DOMParser().parseFromString(stickyNote.content, "text/html")) .body.textContent
                if (!possibleName) {
                    addLog('Failed to read name')
                }

                const newBreakName = possibleName || breakName
                setCurrentRoundBreakName(newBreakName)
            })
        })
    }

    function addToTeamIndex(value: number) {
        setNextTeamIndex(nextTeamIndex + value)
    }

    const teamIndexes = [
        "Arizona Cardinals",
        "Atlanta Falcons",
        "Baltimore Ravens",
        "Buffalo Bills",
        "Carolina Panthers",
        "Chicago Bears",
        "Cincinnati Bengals",
        "Cleveland Browns",
        "Dallas Cowboys",
        "Denver Broncos",
        "Detroit Lions",
        "Green Bay Packers",
        "Houston Texans",
        "Indianapolis Colts",
        "Jacksonville Jaguars",
        "Kansas City Chiefs",
        "Las Vegas Raiders",
        "Los Angeles Chargers",
        "Los Angeles Rams",
        "Miami Dolphins",
        "Minnesota Vikings",
        "New England Patriots",
        "New Orleans Saints",
        "New York Giants",
        "New York Jets",
        "Philadelphia Eagles",
        "Pittsburgh Steelers",
        "San Francisco 49ers",
        "Seattle Seahawks",
        "Tampa Bay Buccaneers",
        "Tennessee Titans",
        "Washington Commanders"
    ]

    function getTeamName(team: number) {
        return teamIndexes[team]
    }

    function addUsers() {
        let newRound = round.clone()
        let localIndex = 0
        let teamsAdded = 0
        miro.board.getSelection().then(sel => {
            sel = sel.sort((a: Text, b: Text) => {
                if (a.y < b.y) return -1 // shift to the left
                if (a.y > b.y) return 1 // shift to the right
                return 0 // stay where you are
            })
            let uniqueUsers = 0
            sel.map((e) => {
                const username = (new DOMParser().parseFromString((e as Text).content, "text/html")) .body.textContent || ""
                if (!newRound.hasUser(username)) {
                    newRound.addUser(username)
                    uniqueUsers++
                }
                const user = newRound.getUser(username) as User
                if (!user.hasBreak(breakName)) {
                    user.addBreak(breakName)
                }
                const breakObject = user.getBreak(breakName) as Break
                let teamIndex = nextTeamIndex + localIndex
                breakObject.addTeam(teamIndex)
                localIndex++
                addLog(`Added ${teamIndex}:${nextTeamIndex}:${teamsAdded}:${getTeamName(teamIndex)} to ${username}`)
                // miro.board.createText({
                //     content: `${teamIndex})`,
                //     x: e.x - e.width / 2,
                //     y: e.y,
                //     width: 20,
                //     style: {
                //         fontSize: 40,
                //     }
                // })
                teamsAdded++
            })
            addLog(`Added ${sel.length} entries. Found ${uniqueUsers} unique users`)
            addToTeamIndex(localIndex)
            setRound(newRound)
            setTeamsAddedAmount(teamsAdded)
        })
    }

    setTimeout(() => {
        setTeamsAddedAmount(0)
        setWasReset(false)
    }, 1000)

    function resetUsers() {
        let newRound = round.clone()
        setNextTeamIndex(0)
        setWasReset(true)
        let clearedTeams = 0
        Array.from(newRound.getUsers()).forEach((user) => {
            clearedTeams += user.clearBreak(breakName)
        })
        setTeamsAddedAmount(-clearedTeams)
    }

    function exportBreak() {
        let exportBreak = new ExportBreak()
        exportBreak.name = breakName
        for (let user of round.getUsers()) {
            for (let [breakN, breakO] of user.breaks) {
                if (breakN != breakName) {
                    continue
                }
                for (let eventO of breakO.teamIndexes) {
                    let eventJSON = new ExportEvent()
                    eventJSON.id = makeid(5)
                    eventJSON.customer = user.username
                    eventJSON.team = getTeamName(eventO)
                    exportBreak.events.push(eventJSON)
                }
            }
        }

        addLog(JSON.stringify(exportBreak))
    }

    return <div className="break">
        <div>Break "<b>{breakName}</b>"</div>
        <button className="button button-primary" type="button" onClick={setBreakName}>Set name</button>
        <div className="my-flex">
            <button className="button button-primary" type="button" onClick={addUsers}>Add teams(s)</button>
            {teamsAddedAmount > 0 ? `+${teamsAddedAmount}` : (teamsAddedAmount < 0 ? `${teamsAddedAmount}` : "")}
        </div>
        <div className="my-flex">
            <button className="button button-primary" type="button" onClick={resetUsers}>Reset teams</button>
            {wasReset ? "Done" : ""}
        </div>
        <button className="button button-primary" type="button" onClick={exportBreak}>Export</button>
    </div>
}