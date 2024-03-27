import {StickyNote, Text} from "@mirohq/websdk-types";
import * as React from "react";
import {useEffect, useState} from "react";
import "./common.css"
import {Round, RoundBreaks} from "../entities";
import BreakResultComponent from "./BreakResultComponent";

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
    const [round, _setRound] = useState(new Round())
    const [roundBreaks, _setRoundBreaks] = useState(new RoundBreaks())
    const [resultPosition, setResultPosition] = useState(new ResultPosition(0, 0))
    const [log, _setLog] = useState<string[]>([])
    const [nextTeamIndex, setNextTeamIndex] = useState(0)

    function setRound(newRound: Round) {
        _setRound(newRound)
    }


    function addLog(value: string) {
        _setLog((currentLog) => [...currentLog, value]);
    }

    function resetRound() {
        _setLog([])
        setResultPosition(new ResultPosition(0, 0))
        resetRoundBreaks()
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
        let gapX = 10
        let teamGapY = 30
        let userHeight = 64
        let teamHeight = 25
        let gapY = 40
        Array.from(round.getUsers()).forEach((user) => {
            let allTeamsAmount = user.getTeamsAmount()
            addLog(`User ${user.username} has ${allTeamsAmount} teams`)
            let allTeamsHeight = allTeamsAmount * teamHeight + (allTeamsAmount - 1) * teamGapY
            let userY = userHeight / 2 + allTeamsHeight / 2
            miro.board.experimental.createMindmapNode({
                nodeView: {
                    content: `${user.username} (${allTeamsAmount})`,
                },
                x: position.x,
                y: relativeY + userY
            }).then((userRoot) => {
                Array.from(user.breaks.values()).forEach((breakData) => {
                    let teamsAmount = breakData.teamIndexes.length
                    let teamsHeight = teamsAmount * teamHeight + (teamsAmount -1) * teamGapY
                    let teamIndexes = breakData.teamIndexes
                    let breakRootX = position.x + gapX
                    let breakRootY = relativeY + teamsHeight / 2;
                    miro.board.experimental.createMindmapNode({
                        nodeView: {
                            content: `${breakData.name} (${teamsAmount})`,
                        },
                        x: breakRootX,
                        y: breakRootY
                    }).then((breakRoot) => {
                        userRoot.add(breakRoot)
                        getTeamNames(teamIndexes).forEach((team, j) => {
                            let teamX = breakRootX + gapX;
                            let teamY = relativeY + (j > 0 ? j - 1 : 0) * teamGapY + j * teamHeight;
                            miro.board.experimental.createMindmapNode({
                                nodeView: {
                                    content: team,
                                },
                                x: teamX,
                                y: teamY
                            }).then((child) => {
                                breakRoot.add(child)
                            })
                        })
                    })
                })
            })
            relativeY += allTeamsHeight + gapY
        })
    }

    function setResultPositionFromSelection() {
        miro.board.getSelection().then(sel => {
            sel.map((e) => {
                const note = e as StickyNote
                setResultPosition(new ResultPosition(note.x , note.y + note.height / 1.5))
            })
        })
    }

    function logStats() {
        miro.board.getSelection().then(sel => {
            console.log(sel)
            let item = (sel[0] as Text)
            addLog(`${item.id}`)
        })
    }

    function selectBreak(index: number) {
        _setRoundBreaks((oldBreaks) => new RoundBreaks([...oldBreaks.breaks], index))
        setNextTeamIndex(0)
    }

    function addEmptyRoundBreak() {
        _setRoundBreaks((oldBreaks) => new RoundBreaks([...oldBreaks.breaks, "Unnamed"], oldBreaks.selectedRoundIndex))
    }

    function setCurrentRoundBreakName(name: string) {
        _setRoundBreaks((oldBreaks) => {
            let newBreaks = new RoundBreaks([...oldBreaks.breaks], oldBreaks.selectedRoundIndex)
            newBreaks.setCurrentRoundBreakName(name)
            return newBreaks
        })
    }

    function resetRoundBreaks() {
        _setRoundBreaks(new RoundBreaks())

    }

    function setLastNickname() {
        miro.board.experimental.getSelection().then(async (sel) => {
            if (sel.length > 0) {
                (sel[0] as Text).content = (document.getElementById('last_username') as HTMLInputElement).value
                sel[0].sync()
            }
        })
    }

    setTimeout(async () => {
        let element = document.getElementById('last_username')
        if (element) {
            let lastUsername = (await miro.board.getById("3458764583798228123")) as Text
            (element as HTMLInputElement).value = lastUsername.content
        }
    }, 1000)

    return <div className="map-body">
        <div className="my-flex my-flex-wrap">
            {
                roundBreaks.breaks.map((roundBreak, index) => {
                    return <button className={index === roundBreaks.selectedRoundIndex ? "my-button my-button-selected" : ""} onClick={() => selectBreak(index)}>
                        {roundBreak}
                    </button>
                })
            }
            <button onClick={addEmptyRoundBreak}>+</button>
        </div>
        {
            roundBreaks.selectedRoundIndex !== null && <BreakResultComponent
                setCurrentRoundBreakName={setCurrentRoundBreakName}
                breakName={roundBreaks.getCurrentBreakName()}
                addLog={addLog}
                round={round}
                setRound={setRound}
                nextTeamIndex={nextTeamIndex}
                setNextTeamIndex={setNextTeamIndex}
            />
        }
        <button className="button button-primary" type="button"
            onClick={resetRound}
        >Reset round</button>
        <button className="button button-primary" type="button" onClick={buildResult}>Build result</button>
        <div className="my-flex">
            <button className="button button-primary" type="button" onClick={setResultPositionFromSelection}>Set position</button>
            <div>{resultPosition.isSet ? "Is set" : ""}</div>
        </div>
        <button className="button button-primary" type="button" onClick={logStats}>Stats</button>
        <div>
            <label>
                Log:
                <textarea readOnly={true} rows={10} cols={30} value={log.toReversed().join('\n')}/>
            </label>
        </div>
        <div>
            <label htmlFor="last_username">Last nickname:</label>
            <input type="text" id="last_username"></input>
            <button onClick={setLastNickname}>Copy</button>
        </div>
    </div>
}