import { readFile } from "fs/promises";
import ExcelJS from "exceljs";

export const handler = {
    channel: "load-xlsx",
    execute: async (event, bw, path) => {
        // load excel file and get workbook
        let wb = new ExcelJS.Workbook()
        let excelFile = await readFile(path).catch(err => console.log(err))
        await wb.xlsx.load(excelFile);
        await loadPlayers(wb, bw).then(players => {
            bw.webContents.send('notify', { message: "Loaded Excel File", color: "positive", timeout: 5000 })
            return players;
        }).catch(err => {
            console.log(err)
            bw.webContents.send('notify', { message: "Error loading Excel File", color: "negative", timeout: 5000 })
            return null;
        })
    }
}

// Initialize Players
async function loadPlayers(workbook, bw) {
    let players = [];
    let playWorksheet = workbook.getWorksheet("Jojo Bettors")
    if (!playWorksheet) {
        console.log("No Jojo Bettors sheet found")
        bw.webContents.send("notify", {
            type: "negative",
            message: "Jojo Bettors sheet not found",
            timeout: 0,
            noClose: true
        })
        return
    }
    // Search each row for data in non-empty cells and add into players
    playWorksheet.eachRow(row => {
        if (row._cells[0].value === null) return
        players.push({
            name: row._cells[0].value,
            tong: row._cells[1].value,
            comm: row._cells[2].value,
            bets: []
        })
    })

    return loadPlayerData(players)
}

//Loading player bet data
async function loadPlayerData(players) {

    let dayWorksheets = await loadDays()

    dayWorksheets.forEach(sheet => {
        //Get 1st row headers and get only names found in Jojo Bettors sheet (formula uses data from Jojo Bettors)
        let playerRow = sheet.getRow(1).values;
        playerRow = playerRow.filter((value, index) => {
            if (value.formula?.includes("Jojo Bettors")) {
                value.index = index
                return value
            }
        })

        // Copy every players bets into players.bets
        playerRow.forEach(p => {
            players.forEach(player => {
                // Matching data from playerRow and players
                if (p.result === player.name) {
                    //Access specific columns belonging to each player based on their index
                    let column = sheet.getColumn(p.index)
                    column.eachCell((cell, rowNum) => {
                        // avoids header row, checks if cell.value is not null and if the cell data is relevant (avoids amount cell if there is no team in same row)
                        if (rowNum > 1 && !!cell.value && !!sheet.getCell(rowNum, 1).value) {
                            let bet = {};
                            bet.day = sheet.name.substring(0, 3);
                            // console.log(sheet.getRow(rowNum).getCell(1).value)
                            if (sheet.getRow(rowNum).getCell(1).value.match(/under/gi)) {
                                bet.team = `${sheet.getRow(rowNum - 2).getCell(1).value} / ${sheet.getRow(rowNum).getCell(1).value.toLowerCase()}`
                            }
                            else if (sheet.getRow(rowNum).getCell(1).value.match(/over/gi)) {
                                bet.team = `${sheet.getRow(rowNum - 3).getCell(1).value} / ${sheet.getRow(rowNum).getCell(1).value.toLowerCase()}`
                            }
                            else {
                                bet.team = sheet.getRow(rowNum).getCell(1).value
                            }

                            if (bet.team.includes("/")) {
                                bet.team = bet.team.substring(0, 3) + bet.team.substring(bet.team.lastIndexOf(" "), bet.team.length)
                            }

                            if (typeof (cell.value) == "number") bet.amount = cell.value
                            else bet.amount = cell.value.result
                            bet.result = sheet.getRow(rowNum).getCell(3).value.toLowerCase()

                            player.bets.push(bet)
                        }

                    })
                }
            })
        })
    })
    return players
}

// Initialize days
export function loadDays() {
    // load player data from specific days
    let dayWorksheets = [];
    let daysRegex = /\b((mon|tue|wed(nes)?|thu(rs)?|fri|sat(ur)?|sun)(day)?)\b/gi

    // Search and add days to dayWorksheets
    wb.eachSheet((sheet, id) => {
        if ((sheet.name !== undefined) && sheet.name.match(daysRegex)) dayWorksheets.push(wb.getWorksheet(id))
    })

    //console.log(dayWorksheets.forEach((s, i) => {console.log(s.name + i)}))
    return dayWorksheets
}