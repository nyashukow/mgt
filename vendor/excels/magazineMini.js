import Excel from 'exceljs'
import Cursor from '@/vendor/excels/Cursor'

const ROWS_PER_PAGE = 48
const COLUMNS_PER_PAGE = 41

export default async function (magazine) {
  const wb = new Excel.Workbook()
  const ws = wb.addWorksheet('Main', {
    pageSetup: {
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: magazine.pages.length,
      paperSize: 9,
      horizontalCentered: true,
      verticalCentered: true,
      orientation:'landscape',
      margins: {
        left: 0.2, right: 0.2,
        top: 0.2, bottom: 0.2,
        header: 0, footer: 0
      }
    }
  })

  render(new Cursor(ws), magazine.pages)

  return await wb.xlsx.writeBuffer()
}

function render(cursor, pages) {
  cursor.setColumnWidth([4, 9, 24, 9, 9, 7].concat(new Array(31).fill(4)).concat([9, 9, 9, 9]))

  for (let i = 0; i < pages.length; i++) {
    renderPage(cursor.createCursor(1 + ROWS_PER_PAGE * i, 1), pages[i])
  }
}

function renderPage(cursor, page) {
  cursor.setRowHeight(new Array(ROWS_PER_PAGE).fill(18.75))

  cursor.getArea(1, 1, ROWS_PER_PAGE, COLUMNS_PER_PAGE).forEach(cell => {
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center'
    }
  })

  renderHeader(cursor.createCursor(6, 1))
  for (let i = 0; i < 5; i++) {
    renderBus(cursor.createCursor(9 + i * 8, 1), page.buses[i])
  }
}

function renderHeader(cursor) {
  cursor.setRowHeight([25, 25, 12.25])

  // merges
  new Array(
    [1, 1, 2, 1],
    [1, 2, 2, 2],
    [1, 3, 2, 3],
    [1, 4, 2, 4],
    [1, 5, 2, 5],
    [1, 6, 2, 6],
    [1, 7, 1, 37],
    [1, 38, 2, 41],
    [3, 38, 3, 41]
  ).forEach(pos => {
    cursor.mergeCells(pos[0], pos[1], pos[2], pos[3])
  })

  //font
  cursor.getArea(1, 1, 2, COLUMNS_PER_PAGE).forEach(cell => {
    cell.font = {
      size: 10,
      bold: true
    }
  })
  cursor.getArea(3, 1, 3, COLUMNS_PER_PAGE).forEach(cell => {
    cell.font = {
      size: 9
    }
  })

  //alignment
  cursor.getCell(1, 1).alignment.textRotation = 90
  cursor.getCell(1, 2).alignment.textRotation = 90
  cursor.getCell(1, 4).alignment.textRotation = 90
  cursor.getCell(1, 5).alignment.textRotation = 90

  //borders
  cursor.setBordersOnArea('medium', 1, 1, 3, COLUMNS_PER_PAGE)

  // content
  new Array(
    { pos: [1, 1], text: '№ выхода.' },
    { pos: [1, 2], text: '№ автоб.' },
    { pos: [1, 3], text: 'Фамилия' },
    { pos: [1, 4], text: 'Таб. №' },
    { pos: [1, 5], text: '№ графика' },
    { pos: [1, 6], text: 'Роспись' },
    { pos: [1, 7], text: 'Календарные числа месяца' },
    { pos: [1, 38], text: 'Режим работы' },
  ).forEach(({ pos, text }) => {
    cursor.getCell(pos[0], pos[1]).value = text
  })
  
  new Array(31).fill(1).map((_, i) => i + 1).forEach(i => {
    cursor.getCell(2, i + 6).value = i
  })

  new Array(38).fill(1).map((_, i) => i + 1).forEach(i => {
    cursor.getCell(3, i).value = i
  })


}

function renderBus(cursor, bus) {
  cursor.mergeCells(1, 1, 8, 1)
  cursor.mergeCells(1, 2, 8, 2)

  cursor.mergeCells(1, 38, 1, 40)
  cursor.mergeCells(2, 38, 2, 40)
  cursor.mergeCells(4, 38, 4, 40)
  cursor.mergeCells(5, 38, 5, 40)
  cursor.mergeCells(6, 38, 6, 40)
  cursor.mergeCells(7, 38, 7, 40)

  //font
  cursor.getArea(1, 1, 8, COLUMNS_PER_PAGE).forEach(cell => {
    cell.font = {
      size: 12
    }
  })
  cursor.getArea(1, 37, 8, COLUMNS_PER_PAGE).forEach(cell => {
    cell.alignment.horizontal = 'left'
    cell.font = {
      size: 9,
      bold: true
    }
  })

  //alignment
  cursor.getCell(1, 1).alignment.textRotation = 90
  cursor.getCell(1, 2).alignment.textRotation = 90
  cursor.getArea(1, 3, 8, 3).forEach(cell => {
    cell.alignment.horizontal = 'left'
  })

  //borders
  cursor.setBordersOnArea('thin', 1, 1, 8, 37)
  new Array(COLUMNS_PER_PAGE, 37, 6, 5, 4, 3, 2, 1).forEach(c => {
    cursor.setBordersAroundArea('medium', 1, 1, 8, c)
  })

  //content
  cursor.getCell(1, 38).value = 'Выход:'
  cursor.getCell(2, 38).value = 'Продолжительность работы'
  cursor.getCell(3, 38).value = '1 смена:'
  cursor.getCell(3, 40).value = '2 смена:'
  cursor.getCell(4, 38).value = 'Выезд из парка:'
  cursor.getCell(5, 38).value = 'Время смены:'
  cursor.getCell(6, 38).value = 'Окончание работы:'
  cursor.getCell(7, 38).value = 'Время обеда'
  cursor.getCell(8, 38).value = '1 смена:'
  cursor.getCell(8, 40).value = '2 смена:'

  if (bus) {
    fillBusInfo(cursor.createCursor(), bus)
  }
}

function fillBusInfo(cursor, bus) {
  cursor.getCell(1, 2).value = bus.num

  const positions = getDriverPositionsByCount(bus.drivers.length)
  
  positions.forEach((pos, i) => {
    fillDriverInfo(cursor.createCursor(pos, 3), bus.drivers[i])
  })

  if (bus.way) {
    fillWayInfo(cursor.createCursor(1, 38), bus.way)
  }
}

function fillDriverInfo(cursor, driver) {
  cursor.getCell(1, 1).value = driver.shortName
  cursor.getCell(1, 2).value = driver.num
  cursor.getCell(1, 3).value = driver.graphic && driver.graphic.name
}

function fillWayInfo(cursor, way) {
  cursor.getCell(1, 4).value = way.num

  if (way.times) {
    cursor.getCell(3, 2).value = way.times.durationFirstSmene
    cursor.getCell(3, 4).value = way.times.durationSecondSmene
    cursor.getCell(4, 4).value = way.times.outPark
    cursor.getCell(5, 4).value = way.times.change
    cursor.getCell(6, 4).value = way.times.endWork
    cursor.getCell(8, 2).value = way.times.lunchFirstSmene
    cursor.getCell(8, 4).value = way.times.lunchSecondSmene
  }
}

function getDriverPositionsByCount(count) {
  switch (count) {
    case 1:
      return [5]
    case 2:
      return [3, 7]
    case 3:
      return [2, 5, 8]
    case 4:
      return [2, 4, 6, 8]
    default:
      return []
  }
}