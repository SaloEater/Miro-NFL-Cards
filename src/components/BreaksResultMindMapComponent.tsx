import {SelectionUpdateEvent, StickyNote, Text} from "@mirohq/websdk-types";
import * as React from "react";
import {ChangeEvent, useEffect, useRef, useState} from "react";
import "./common.css"
import {Mutex, Round, RoundBreaks} from "../entities";
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

const KeyCounter = 'counter'
const KeyAuto = "auto"
const shoppingCartMutex = new Mutex();

export default function BreaksResultMindMapComponent() {
    const [round, _setRound] = useState(new Round())
    const [roundBreaks, _setRoundBreaks] = useState(new RoundBreaks())
    const [log, _setLog] = useState<string[]>([])
    const [nextTeamIndex, setNextTeamIndex] = useState(0)
    const [counter, setCounter] = useState(1)
    const [buyersQueue, setBuyersQueue] = useState<string[]>([])
    const [isAuto, _setIsAuto] = useState(false)
    const isAutoRef = useRef(isAuto);
    const counterRef = useRef(counter);

    function setRound(newRound: Round) {
        _setRound(newRound)
    }

    function addLog(value: string) {
        _setLog((currentLog) => [...currentLog, value]);
    }

    function resetRound() {
        _setLog([])
        resetRoundBreaks()
        setRound(new Round())
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

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function buildResult() {
        let sel = await miro.board.getSelection()
        if (sel.length <= 0) {
            addLog('Select sticky note to build a result')
            return
        }
        const note = sel[0] as StickyNote
        const position = new ResultPosition(note.x , note.y + note.height / 1.5)
        let relativeY = position.y
        let gapX = 10
        let teamGapY = 30
        let userHeight = 64
        let teamHeight = 25
        let gapY = 40
        let sorted = Array.from(round.getUsers()).sort((a, b) => {
            let aUsername = a.username.trim()
            let bUsername = b.username.trim()

            if(aUsername < bUsername) {
                return -1; // return -1 if a should come before b
            }
            if(aUsername > bUsername) {
                return 1; // return 1 if a should come after b
            }
            return 0; // return 0 if a and b are equal
        })

        let teamsLeft = Array.from(sorted.values()).reduce((acc, user) => acc + user.getTeamsAmount(), 0)
        for (let [userIndex, user] of sorted.entries()) {
            let allTeamsAmount = user.getTeamsAmount()
            if (userIndex > 0) {
                await sleep(1000 * allTeamsAmount);
            }
            addLog(`User ${user.username} has ${allTeamsAmount} teams`)
            let allTeamsHeight = allTeamsAmount * teamHeight + (allTeamsAmount - 1) * teamGapY
            let userY = userHeight / 2 + allTeamsHeight / 2
            miro.board.experimental.createMindmapNode({
                nodeView: {
                    content: `${user.username} (${allTeamsAmount})`,
                },
                x: position.x,
                y: relativeY + userY
            }).then(async (userRoot) => {
                if (userIndex == 0) {
                    miro.board.viewport.zoomTo(userRoot)
                }
                Array.from(user.breaks.values()).forEach(async (breakData, breakIndex) => {
                    await sleep(400 * breakIndex)
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
                        getTeamNames(teamIndexes).forEach(async (team, j) => {
                            await sleep(50 * breakIndex)
                            let teamX = breakRootX + gapX;
                            let teamY = relativeY + (j > 0 ? j - 1 : 0) * teamGapY + j * teamHeight;
                            miro.board.experimental.createMindmapNode({
                                nodeView: {
                                    content: `${team}[${teamIndexes[j]}]`,
                                },
                                x: teamX,
                                y: teamY
                            }).then((child) => {
                                breakRoot.add(child)
                                teamsLeft--
                                addLog(`${teamsLeft} teams left to add`)
                            })
                        })
                    })
                })
            })
            relativeY += allTeamsHeight + gapY
        }
    }

    function logStats() {
        // miro.board.getSelection().then(sel => {
        //     console.log(sel)
        //     let item = (sel[0] as Text)
        //     addLog(`id: ${item.id}, x: ${item.x}, y: ${item.y}, w: ${item.width}, h: ${item.height}`)
        // })
        addLog('is auto is ' + (isAuto ? 'true' : 'false') )

        let sorted = Array.from(round.getUsers()).sort((a, b) => {
            let aUsername = a.username.trim()
            let bUsername = b.username.trim()

            if(aUsername < bUsername) {
                return -1; // return -1 if a should come before b
            }
            if(aUsername > bUsername) {
                return 1; // return 1 if a should come after b
            }
            return 0; // return 0 if a and b are equal
        })
        let teamsLeft = Array.from(sorted.values()).reduce((acc, user) => acc + user.getTeamsAmount(), 0)
        addLog(`${teamsLeft} teams`)
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

    function printCounter() {
        miro.board.experimental.getSelection().then((sel) => {
            if (counter < 0) {
                addLog(`Specify counter to start`)
                return
            }
            if (sel.length <= 0) {
                addLog('You have to select text with username to put a counter next to it')
                return
            }
            let currentUserText = (sel[0] as Text)
            miro.board.createText({
                content: `${counter})`,
                x: currentUserText.x - currentUserText.width / 2 - (counter > 9 ? 15 : 5),
                y: currentUserText.y,
                width: 20,
                style: {
                    fontSize: 25,
                }
            })
            increaseCounter()
        })
    }

    function decreaseCounter() {
        setCounter((old) => {
            let newV = old - 1
            localStorage.setItem(KeyCounter, newV.toString())
            return newV
        })
    }

    function increaseCounter() {
        setCounter((old) => {
            let newV = old + 1
            localStorage.setItem(KeyCounter, newV.toString())
            return newV
        })
    }

    function changeCounter(e: ChangeEvent) {
        let newValue = e.currentTarget.value as string;
        if (newValue == "") {
            setCounter(-1)
        } else {
            let newInt = parseInt(newValue, 10)
            setCounter(newInt)
        }
    }

    function clearLog() {
        _setLog([])
    }

    function addUsernamesToQueue(usernames: string[]) {
        shoppingCartMutex.runExclusive(async () => {
            let existingUsernames: string[] = JSON.parse(localStorage.getItem('usernames_queue') ?? "[]")
            existingUsernames = existingUsernames.concat(usernames)
            setBuyersQueue(() => existingUsernames)
            localStorage.setItem('usernames_queue', JSON.stringify(existingUsernames))
        });
    }

    function clearQueue() {
        shoppingCartMutex.runExclusive(async () => {
            localStorage.setItem('usernames_queue', JSON.stringify([]))
            setBuyersQueue([])
        });
    }

    useEffect(() => {
        isAutoRef.current = isAuto; // Keep the ref current value in sync with isAuto
    }, [isAuto]); // Update the ref value whenever isAuto changes

    useEffect(() => {
        counterRef.current = counter; // Keep the ref current value in sync with isAuto
    }, [counter]); // Update the ref value whenever isAuto changes

    useEffect(() => {
        setCounter(parseInt(localStorage.getItem(KeyCounter) ?? "1"))
        let localV = localStorage.getItem(KeyAuto)
        let nextAuto = !!(localV ?? "")
        setIsAuto(nextAuto)

        miro.board.ui.off('selection:update', selectionUpdate)
        setTimeout(() => {miro.board.ui.on('selection:update', selectionUpdate);}, 200)
    }, []);

    function selectionUpdate(event: SelectionUpdateEvent) {
        let counterValue = counterRef.current
        let isAutoValue = isAutoRef.current
        if (isAutoValue) {
            if (counterValue < 0) {
                addLog(`Specify counter to start`)
                return
            }
            if (event.items.length <= 0) {
                addLog('You have to select text with username to put a counter next to it')
                return
            }
            if (!("width" in event.items[0])) {
                addLog('You have to select text element with username to put a counter next to it')
                return
            }
            let currentUserText = (event.items[0] as Text)

            if (currentUserText.content.indexOf('$') != -1 || currentUserText.content.indexOf('#') != -1) {
                return
            }

            miro.board.createText({
                content: `${counterValue})`,
                x: currentUserText.x - currentUserText.width / 2 - (counterValue > 9 ? 15 : 5),
                y: currentUserText.y,
                width: 20,
                style: {
                    fontSize: 25,
                }
            }).then(() => increaseCounter())
        }
    }

    function resetCounter() {
        localStorage.setItem(KeyCounter, "1")
        setCounter(1)
    }

    function setIsAuto(newV: boolean) {
        _setIsAuto(newV)
    }

    function switchAuto() {
        _setIsAuto((old) => {
            let newV = !old
            localStorage.setItem(KeyAuto, newV ? "1" : "")
            return newV
        })
    }

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
        <button className="button button-primary" type="button" onClick={buildResult}>Build</button>
        <button className="button button-primary" type="button" onClick={logStats}>Stats</button>
        <div className="my-flex">
            <div>
                <div><button type="button" onClick={increaseCounter}>+1</button></div>
                <div><button type="button" onClick={decreaseCounter}>-1</button></div>
            </div>
            <div>
                <div><input className="my-short-input" type="text" value={counter < 0 ? "" : counter} onChange={changeCounter}></input></div>
                <button type="button" onClick={resetCounter}>1</button>
            </div>
            <button className="button button-primary" type="button" onClick={printCounter}>Add counter</button>
            <label>
                Auto
                <input type="checkbox" checked={isAuto} onChange={switchAuto}/>
            </label>
        </div>
        <div>
            <div className="my-flex">
                <div>Log</div>
                <button className="button button-primary" type="button" onClick={clearLog}>Clear</button>
            </div>
            <textarea readOnly={true} rows={10} cols={30} value={log.toReversed().join('\n')}/>
        </div>
        <div>
            Buyers queue
            <textarea id="buyers-queue" readOnly={true} rows={10} cols={30} value={buyersQueue.toReversed().join('\n')}/>
            <button className="button button-primary" type="button" onClick={clearQueue}>Clear</button>
        </div>
    </div>
}