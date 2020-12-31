export function randomString(length: number): string {
    let returnString = "";
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const _ of Array(length)) {
        const randInt = randomNumber(0, 35);
        if (randomNumber(0, 1) === 1) {
            returnString += randInt.toString(36);
        } else {
            returnString += randInt.toString(36).toUpperCase();
        }
    }
    return returnString;
}

export function randomNumber(min: number, max: number): number {
    return Math.round(Math.random() * (max - min) + min);
}