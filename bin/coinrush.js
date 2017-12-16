#!/usr/bin/env node
const program = require('commander')
const axios = require('axios')
const ora = require('ora')
const Table = require('cli-table2')
const colors = require('colors')
const humanize = require('humanize-plus')
const os = require('os')

const platform = os.platform() // linux, darwin, win32, sunos
const list = val => val.split(',')

program
  .version('0.1.0')
  .option('-c, --convert [currency]', 'convert to your fiat currency', 'usd')
  .option('-p, --price [symbol]', 'display pricing data for a comma separated list of coin symbols', list)
  .option('-t, --top [index]', 'display the top ranked coins according to market cap')
  .parse(process.argv)

const convert = program.convert.toUpperCase()
const availableCurrencies = ['USD', 'AUD', 'BRL', 'CAD', 'CHF', 'CLP', 'CNY', 'CZK', 'DKK', 'EUR', 'GBP', 'HKD', 'HUF', 'IDR', 'ILS', 'INR', 'JPY', 'KRW', 'MXN', 'MYR', 'NOK', 'NZD', 'PHP', 'PKR', 'PLN', 'RUB', 'SEK', 'SGD', 'THB', 'TRY', 'TWD', 'ZAR']
if (availableCurrencies.indexOf(convert) === -1) {
  return console.log('We cannot convert to your fiat currency.'.red)
}
const price = program.price || []
const top = !isNaN(program.top) && +program.top > 0 ? +program.top : (price.length > 0 ? 1500 : 10)
const table = new Table({
  chars: {
    'top': '-',
    'top-mid': '-',
    'top-left': '-',
    'top-right': '-',
    'bottom': '-',
    'bottom-mid': '-',
    'bottom-left': '-',
    'bottom-right': '-',
    'left': '║',
    'left-mid': '-' ,
    'mid': '-' ,
    'mid-mid': '-',
    'right': '║',
    'right-mid': '-',
    'middle': '│'
  },
  head: ['Rank', 'Coin', `Price (${convert})`, 'Change (24H)', 'Change (1H)', `Market Cap (${convert})`].map(title => title.yellow),
  colWidths: [6, 14, 15, 15, 15, 20]
})

const spinner = ora('Fetching data').start()
const sourceUrl = `https://api.coinmarketcap.com/v1/ticker/?limit=${top}&convert=${convert}`
axios.get(sourceUrl)
.then(function (response) {
  spinner.stop()
  response.data
    .filter(record => {
      if (price.length > 0) {
        return price.some(keyword => record.symbol.toLowerCase() === keyword.toLowerCase())
      }
      return true
    })
    .map(record => {
      const percentChange24h = record.percent_change_24h
      const textChange24h = `${percentChange24h}%`
      const change24h = percentChange24h? (percentChange24h > 0 ? textChange24h.green : textChange24h.red) : 'NA'
      const percentChange1h = record.percent_change_1h
      const textChange1h = `${percentChange1h}%`
      const change1h = percentChange1h ? (percentChange1h > 0 ? textChange1h.green : textChange1h.red) : 'NA'
      const marketCap = record[`market_cap_${convert}`.toLowerCase()]
      const displayedMarketCap = humanize.compactInteger(marketCap, 3)
      return [
        record.rank,
        `${record.symbol}`,
        record[`price_${convert}`.toLowerCase()],
        change24h,
        change1h,
        displayedMarketCap
      ]
    })
    .forEach(record => table.push(record))
  if (table.length === 0) {
    console.log('Unable to price coins matching your keywords'.red)
  } else {
    console.log(`Data source from coinmarketcap.com at ${new Date().toLocaleTimeString()}`)
    console.log(table.toString())
  }
})
.catch(function (error) {
  spinner.stop()
  console.error('Unable to connect to coinmarketcap.com API'.red)
})
