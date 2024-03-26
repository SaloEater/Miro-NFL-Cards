import {StickyNote, Text} from "@mirohq/websdk-types";
import * as React from "react";
import {useState} from "react";

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

export default function BreakResultComponent() {
    const [nextTeamIndex, setNextTeamIndex] = useState(0)
    const [users, setUsers] = useState<{map: Map<string, number[]>}>({map: new Map<string, number[]>()})
    const [resultPosition, setResultPosition] = useState(new ResultPosition(0, 0))

    function resetBreakResult() {
        setNextTeamIndex(0)
        setUsers({map: new Map<string, number[]>()})
    }

    function addToTeamIndex(value: number) {
        setNextTeamIndex(nextTeamIndex + value)
    }

    function forceUpdateUsers() {
        setUsers({map: users.map})
    }

    function addUsers() {
        let localIndex = 0
        miro.board.getSelection().then(sel => {
            sel.map((e) => {
                let user = (e as Text).content
                if (!users.map.has(user)) {
                    users.map.set(user, [])
                }
                let teams = users.map.get(user) as number[]
                teams.push(nextTeamIndex + localIndex)
                users.map.set(user, teams)
                localIndex++
            })
            forceUpdateUsers()
            addToTeamIndex(localIndex)
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
        let moved =  false
        let nextY = position.y
        Array.from(users.map.entries()).forEach((value) => {
            let user = value[0]
            let teams = value[1]
            let halfOfHeight =  teams.length * 15
            miro.board.createStickyNote({
                width: 75,
                content: user,
                x: position.x,
                y: nextY + halfOfHeight / 2
            }).then(e => {
                if (!moved) {
                    moved = true
                    miro.board.viewport.zoomTo(e)
                }
            })
            miro.board.createText({
                x: position.x + 100,
                y: nextY + halfOfHeight / 2,
                content: getTeamNames(teams).join('\n'),
            })
            nextY += halfOfHeight + 60
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

    return <div>
        <button className="button button-primary" type="button"
            onClick={resetBreakResult}
        >Reset</button>
        <button className="button button-primary" type="button" onClick={addUsers}>Add user(s)</button>
        <button className="button button-primary" type="button" onClick={buildResult}>Build result</button>
        <div className="flex">
            {resultPosition.isSet ? "Is set" : "Not set"}
            <button className="button button-primary" type="button" onClick={setResultPositionFromSelection}>Set</button>
        </div>
    </div>
}