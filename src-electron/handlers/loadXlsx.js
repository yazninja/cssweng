import { ipcMain } from "electron";
import { readFile } from "fs/promises";
import ExcelJS from "exceljs";

// Initialize Players
async function loadPlayers(workbook) {
  let players = [];
  let playWorksheet = workbook.getWorksheet("Jojo Bettors")
  if (!playWorksheet) return { error: "No Jojo Bettors sheet found" }
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
            if (typeof (cell.value) == "number") {
              let bet = {};
              bet.day = sheet.name.substring(0, 3);
              // console.log(sheet.getRow(rowNum).getCell(1).value)
              if (sheet.getRow(rowNum).getCell(1).value.match(/under/gi)) {
                bet.team = `${sheet.getRow(rowNum - 2).getCell(1).value} ${sheet.getRow(rowNum).getCell(1).value.toLowerCase()}`
              }
              else if (sheet.getRow(rowNum).getCell(1).value.match(/over/gi)) {
                bet.team = `${sheet.getRow(rowNum - 3).getCell(1).value} ${sheet.getRow(rowNum).getCell(1).value.toLowerCase()}`
              }
              else {
                bet.team = sheet.getRow(rowNum).getCell(1).value
              }

              if (bet.team.includes("/")) {
                bet.team = bet.team.substring(0, 3) + bet.team.substring(bet.team.lastIndexOf(" "), bet.team.length)
              }

              //TODO: obtain cell value from sep 12 mike foreign 269k amount (need to access formula)
              bet.amount = cell.value;
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
  // TODO: remove undefined element at the end of dayWorksheets array
  wb.eachSheet((sheet, id) => {
    if ((sheet.name !== undefined) && sheet.name.match(daysRegex)) dayWorksheets.push(wb.getWorksheet(id))
  })

  //console.log(dayWorksheets.forEach((s, i) => {console.log(s.name + i)}))
  return dayWorksheets
}


export async function loadXlsx(path) {
  ipcMain.handle('loadXlsx', async (event, path) => {
    let excelFile = await readFile(path).catch(err => console.log(err))
    //const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(excelFile);

    let players = await loadPlayers(wb)

    //console.log(`Loaded ${players.length} players`)
    //console.log(players[0].bets)
    return players
  })
}

const wb = new ExcelJS.Workbook()
