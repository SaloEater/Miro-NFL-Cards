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
        return (this.breaks.get(breakName) as Break).clear()
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

/**
 * A lock for synchronizing async operations.
 * Use this to protect a critical section
 * from getting modified by multiple async operations
 * at the same time.
 */
export class Mutex {
    /**
     * When multiple operations attempt to acquire the lock,
     * this queue remembers the order of operations.
     */
    private _queue: {
        resolve: (release: ReleaseFunction) => void;
    }[] = [];

    private _isLocked = false;

    /**
     * Wait until the lock is acquired.
     * @returns A function that releases the acquired lock.
     */
    acquire() {
        return new Promise<ReleaseFunction>((resolve) => {
            this._queue.push({resolve});
            this._dispatch();
        });
    }

    /**
     * Enqueue a function to be run serially.
     *
     * This ensures no other functions will start running
     * until `callback` finishes running.
     * @param callback Function to be run exclusively.
     * @returns The return value of `callback`.
     */
    async runExclusive<T>(callback: () => Promise<T>) {
        const release = await this.acquire();
        try {
            return await callback();
        } finally {
            release();
        }
    }

    /**
     * Check the availability of the resource
     * and provide access to the next operation in the queue.
     *
     * _dispatch is called whenever availability changes,
     * such as after lock acquire request or lock release.
     */
    private _dispatch() {
        if (this._isLocked) {
            // The resource is still locked.
            // Wait until next time.
            return;
        }
        const nextEntry = this._queue.shift();
        if (!nextEntry) {
            // There is nothing in the queue.
            // Do nothing until next dispatch.
            return;
        }
        // The resource is available.
        this._isLocked = true; // Lock it.
        // and give access to the next operation
        // in the queue.
        nextEntry.resolve(this._buildRelease());
    }

    /**
     * Build a release function for each operation
     * so that it can release the lock after
     * the operation is complete.
     */
    private _buildRelease(): ReleaseFunction {
        return () => {
            // Each release function make
            // the resource available again
            this._isLocked = false;
            // and call dispatch.
            this._dispatch();
        };
    }
}

type ReleaseFunction = () => void;