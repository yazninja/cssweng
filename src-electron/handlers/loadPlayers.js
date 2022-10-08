import Exceljs from "exceljs"

export function loadPlayers() {
    let players = [];
    // Initialize Players
    let playWorksheet = workbook.getWorksheet("Jojo Bettors")
    if(!playWorksheet) { return { error: "Missing Jojo Bettors Worksheet", errorType: "error"} }
    playWorksheet.eachRow(row => {
      if (row._cells[0].value === null) return
      players.push({
        name: row._cells[0].value,
        tong: row._cells[1].value,
        comm: row._cells[2].value,
        bets: []
      })
    })
}