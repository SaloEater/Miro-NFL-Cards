export class Round {
    private users: Map<string, User>

    constructor(users = new Map<string, User>) {
        this.users = users
    }

    clone() {
        let users = new Map<string, User>()
        this.users.forEach((user, username) => {
            users.set(username, user.clone())
        })
        return new Round(users)
    }

    hasUser(username: string) {
        return this.users.has(username);
    }

    addUser(username: string) {
        this.users.set(username, new User(username))
    }

    getUser(username: string) {
        return this.users.get(username)
    }

    getUsers() {
        return this.users.values()
    }
}

export class User {
    public username: string
    public breaks: Map<string, Break>

    constructor(username: string, breaks = new Map<string, Break>()) {
        this.username = username
        this.breaks = breaks
    }

    getBreak(breakName: string) {
        return this.breaks.get(breakName)
    }

    clone() {
        let breaks = new Map<string, Break>()
        this.breaks.forEach((roundBreak, breakName ) => breaks.set(breakName, new Break(breakName, [...roundBreak.teamIndexes])))
        return new User(this.username, breaks)
    }

    hasBreak(breakName: string) {
        return this.breaks.has(breakName);
    }

    addBreak(breakName: string) {
        this.breaks.set(breakName, new Break(breakName))
    }

    clearBreak(breakName: string) {
        return (this.breaks.get(breakName)as Break).clear()
    }

    getTeamsAmount() {
        return Array.from(this.breaks.values()).reduce((total, breakObject) => total + breakObject.teamIndexes.length, 0)
    }
}

export class Break {
    public name: string
    public teamIndexes: number[]

    constructor(name: string, teams: number[] = []) {
        this.teamIndexes = teams
        this.name = name
    }

    addTeam(teamIndex: number) {
        this.teamIndexes.push(teamIndex)
    }

    clear() {
        let oldAmount = this.teamIndexes.length
        this.teamIndexes = []
        return oldAmount
    }
}

export class RoundBreaks {
    public breaks: string[]
    public selectedRoundIndex: number|null = null

    constructor(breaks: string[] = [], selectedRound: number|null = null) {
        this.breaks = breaks
        this.selectedRoundIndex = selectedRound
    }

    setCurrentRoundBreakName(name: string) {
        if (this.selectedRoundIndex !== null) {
            this.breaks = [
                ...this.breaks.slice(0, this.selectedRoundIndex),
                name,
                ...this.breaks.slice(this.selectedRoundIndex + 1)
            ];
        }
    }

    getCurrentBreakName() {
        if (this.selectedRoundIndex === null) {
            return ""
        }

        return this.breaks[this.selectedRoundIndex]
    }
}