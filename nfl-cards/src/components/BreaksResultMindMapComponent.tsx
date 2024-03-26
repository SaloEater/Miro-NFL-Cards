import {MindmapNode, StickyNote, Text} from "@mirohq/websdk-types";
import * as React from "react";
import {useState} from "react";
import "./BreakResultMindMapComponent.css"

class ResultPosition {
    public x: number
    public y: number
    public isSet: boolean = false

    constructor(x: number, y: number) {
        this.x = x
        this.y = y
        if (x != 0 || y != 0) {
            this.isSet = true
        }
    }

}

export default function BreaksResultMindMapComponent() {
    const [nextTeamIndex, setNextTeamIndex] = useState(0)
    const [users, setUsers] = useState<{map: Map<string, number[]>}>({map: new Map<string, number[]>()})
    const [resultPosition, setResultPosition] = useState(new ResultPosition(0, 0))
    const [log, _setLog] = useState<string[]>([])
    console.log(log)

    //@ts-ignore
    function addLog(value: string) {
        _setLog((currentLog) => [...currentLog, value]);
    }

    function addLogArray(values: string[]) {
        _setLog((currentLog) => [...currentLog, ...values]);
    }

    function resetBreakResult() {
        _setLog([])
        setNextTeamIndex(0)
        setUsers({map: new Map<string, number[]>()})
        //setResultPosition(new ResultPosition(0, 0))
    }

    function addToTeamIndex(value: number) {
        setNextTeamIndex(nextTeamIndex + value)
    }

    function forceUpdateUsers() {
        setUsers(prevUsers => ({map: new Map(prevUsers.map)}));
    }

    function addUsers() {
        let localIndex = 0
        let localLog: string[] = []
        miro.board.getSelection().then(sel => {
            let uniqueUsers = 0
            sel.map((e) => {
                const user = (new DOMParser().parseFromString((e as Text).content, "text/html")) .body.textContent || ""
                if (!users.map.has(user)) {
                    users.map.set(user, [])
                    uniqueUsers++
                }
                let teams = users.map.get(user) as number[]
                teams.push(nextTeamIndex + localIndex)
                users.map.set(user, teams)
                localIndex++
            })
            addLogArray([`Added ${sel.length} entries. Found ${uniqueUsers} unique users`])
            forceUpdateUsers()
            addToTeamIndex(localIndex)
            addLogArray(localLog)
        })
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

    function getTeamNames(teams: number[]) {
        return teamIndexes.filter((_, j) => teams.indexOf(j) !== -1)
    }

    async function buildResult() {
        const position = new ResultPosition(resultPosition.x, resultPosition.y)
        let relativeY = position.y
        let teamGapX = 10
        let teamGapY = 30
        let userHeight = 64
        let teamHeight = 25
        let gapY = 40
        Array.from(users.map.entries()).forEach((userData) => {
            let user = userData[0]
            let teams = userData[1]
            let teamsHeight = teams.length * teamHeight + (teams.length - 1) * teamGapY
            let userY = userHeight / 2 + teamsHeight / 2
            miro.board.experimental.createMindmapNode({
                nodeView: {
                    content: user,
                },
                x: position.x,
                y: relativeY + userY
            }).then((userRoot) => {
                getTeamNames(teams).forEach((team, j) => {
                    miro.board.experimental.createMindmapNode({
                        nodeView: {
                            content: team,
                        },
                        x: position.x + teamGapX,
                        y: relativeY + (j > 0 ? j - 1 : 0) * teamGapY + j * teamHeight
                    }).then((child) => {
                        console.log(child.nodeView.content, child.height)
                        userRoot.add(child)
                    })
                })
            })
            relativeY += teamsHeight + gapY
        })
    }

    function setResultPositionFromSelection() {
        miro.board.getSelection().then(sel => {
            sel.map((e) => {
                const note = e as StickyNote
                setResultPosition(new ResultPosition(note.x, note.y))
            })
        })
    }

    function logStats() {
        miro.board.getSelection().then(sel => {
            console.log(sel)
            let item = (sel[0] as Text)
            addLog(`height: ${item.height}`)
        })
    }

    return <div className="map-body">
        <button className="button button-primary" type="button"
            onClick={resetBreakResult}
        >Reset</button>
        <div className="grid2">
            <div>{users.map.size}</div>
            <button className="button button-primary" type="button" onClick={addUsers}>Add user(s)</button>
        </div>
        <button className="button button-primary" type="button" onClick={buildResult}>Build result</button>
        <div className="grid2">
            <div>{resultPosition.isSet ? "Is set" : "Not set"}</div>
            <button className="button button-primary" type="button" onClick={setResultPositionFromSelection}>Set</button>
        </div>
        <button className="button button-primary" type="button" onClick={logStats}>Stats</button>
        <div>
            <label>
                Log:
                <textarea readOnly={true} rows={10} cols={30} value={log.toReversed().join('\n')}/>
            </label>
        </div>
    </div>
}