import Exceljs from "exceljs"

export async function loadDays() {
  let dayWorksheets = [];
  let daysRegex = /\b((mon|tue|wed(nes)?|thu(rs)?|fri|sat(ur)?|sun)(day)?)\b/gi
  workbook.eachSheet((sheet, id) => {
    if (sheet.name.match(daysRegex)) dayWorksheets.push(workbook.getWorksheet(id))
  })

  dayWorksheets.forEach(sheet => {
    let playerRow = sheet.getRow(1).values;
    playerRow = playerRow.filter((value, index) => {
      if (value.formula?.includes("Jojo Bettors")) {
        value.index = index
        return value
      }
    })
    playerRow.forEach(p => {
      players.forEach(player => {
        if (p.result === player.name) {
          let column = sheet.getColumn(p.index)
          column.eachCell((cell, rowNum) => {
            if (typeof (cell.value) == "number") {
              let bet = {};
              bet.day = sheet.name
              bet.amount = cell.value;
              // console.log(sheet.getRow(rowNum).getCell(1).value)
              if (sheet.getRow(rowNum).getCell(1).value.match(/under/gi)) {
                bet.team = `${sheet.getRow(rowNum - 2).getCell(1).value} / ${sheet.getRow(rowNum).getCell(1).value.toUpperCase()}`
              }
              else if (sheet.getRow(rowNum).getCell(1).value.match(/over/gi)) {
                bet.team = `${sheet.getRow(rowNum - 3).getCell(1).value} / ${sheet.getRow(rowNum).getCell(1).value.toUpperCase()}`
              }
              else {
                bet.team = sheet.getRow(rowNum).getCell(1).value
              }
              bet.result = sheet.getRow(rowNum).getCell(3).value
              player.bets.push(bet)
            }
          })
        }
      })
    })
  })
}