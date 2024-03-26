import {StickyNote, Text} from "@mirohq/websdk-types";
import * as React from "react";
import {Break, Round, User} from "../entities";
import "./BreakResultComponent.css"

export default function BreakResultComponent(props: {setCurrentRoundBreakName: (value: string) => void, breakName: string, addLog: (log: string) => void, round: Round, setRound: (roundBreaks: Round) => void, nextTeamIndex: number, setNextTeamIndex: (value: number) => void}) {
    const {setCurrentRoundBreakName, breakName, addLog, round, setRound, nextTeamIndex, setNextTeamIndex} = props

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

    function addUsers() {
        let newRound = round.clone()
        let localIndex = 0
        miro.board.getSelection().then(sel => {
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
                breakObject.addTeam(nextTeamIndex + localIndex)
                localIndex++
            })
            addLog(`Added ${sel.length} entries. Found ${uniqueUsers} unique users`)
            addToTeamIndex(localIndex)
            setRound(newRound)
        })
    }

    function resetUsers() {
        let newRound = round.clone()
        Array.from(newRound.getUsers()).forEach((user) => {
            user.clearBreak(breakName)
        })
        setNextTeamIndex(0)
    }

    return <div className="break">
        <div>Break "<b>{breakName}</b>"</div>
        <button className="button button-primary" type="button" onClick={setBreakName}>Set name</button>
        <button className="button button-primary" type="button" onClick={addUsers}>Add teams(s)</button>
        <button className="button button-primary" type="button" onClick={resetUsers}>Reset teams</button>
    </div>
}