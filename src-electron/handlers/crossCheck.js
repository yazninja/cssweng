import ExcelJS from 'exceljs'
import { readFile } from 'fs/promises'

export const handler = {
    channel: 'cross-check',
    execute: async (bw) => {
          console.log("cross-check script loaded")  
    }
}