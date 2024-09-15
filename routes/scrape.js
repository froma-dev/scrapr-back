const express = require('express')
const puppeteer = require('puppeteer')
const fs = require('fs')
const path = require('path')
const pdf = require('pdf-parse')
const NodeCache = require('node-cache')
const axios = require('axios')
const {v4: uuidv4} = require('uuid');
const CONFIG = require('../config');
const backendURL = `${CONFIG.PROTOCOL}://${CONFIG.HOST}:${CONFIG.PORT}`;
const PDF_URL = `${backendURL}${process.env.PDF_URL}`

const router = express.Router()
const scrapePdfCache = new NodeCache()
const PDF_TTL = 60 * 60 * 24 * 15 * 1000 // 15 days

async function scrape({url, ...params}) {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    const {waitForSelector, evaluate, evaluateItem, scrapeFile} = params
    const evaluation = evaluate.join(' ')

    await page.goto(String(url))
    await page.waitForSelector(waitForSelector)

    const title = await page.evaluate(() => document.title)
    const evaluations = await page.evaluate((evaluation, evaluate, evaluateItem) => {
        const mappedEvaluations = Array.from(document.querySelectorAll(evaluation))

        return mappedEvaluations.map(el => el[evaluateItem])
    }, evaluation, evaluate, evaluateItem)

    await browser.close()

    return {title, evaluations}
}
function cacheScrapedPdf(data) {
    scrapePdfCache.set('pdf', data, PDF_TTL)

    return data
}
function sendResponse(req, res, data) {
    res.status(201).json(data)
}
function sendErrorResponse(req, res, err) {
    res.status(500).json({title: 'title', list: [], error: err})
}
async function readLocalPdf({filePath}) {
    let dataBuffer = fs.readFileSync(path.resolve(__dirname, filePath));

    return await pdf(dataBuffer)
}
async function readPdfBuffer(dataBuffer) {
    return pdf(dataBuffer)
}
function joinDataChunks (response) {
    const dataChunks = [];
    return new Promise((resolve, reject) => {
        response.data.on('data', (chunk) => dataChunks.push(chunk))
        response.data.on('end', () => resolve(Buffer.concat(dataChunks)))
        response.data.on('error', (err) => reject(err))
    })
}

router.post('/pdf', (req, res) => {
    const cachedPdf = scrapePdfCache.get('pdf')

    if (cachedPdf == null) {
        try {
            axios.get(PDF_URL, {responseType: 'stream'})
                .then(joinDataChunks)
                .then(readPdfBuffer)
                .then(createPdfResponse)
                .then(cacheScrapedPdf)
                .then((data) => sendResponse(req, res, data))
                .catch(err => sendErrorResponse(req, res, err))
        } catch (err) {
            sendErrorResponse(req, res, err)
        }
    } else {

        sendResponse(req, res, cachedPdf)
    }
})

router.post('/', (req, res) => {
    const params = req.body;

    scrape(params).then((data) => {
        res.status(201).json(data);
    })
})

function createPdfResponse(fromData) {
    const {info, text} = fromData
    let lines = text.split('\n').filter((line, index) => line.length > 0 && line.trim() !== '')
    lines = lines.filter((line, index) => index > 0)

    const parsedData = lines
        .map(line => {
            const match = line.match(/(\d+\*{5})([\w\s]+)$/)

            if (match) {
                return {
                    id: uuidv4(),
                    dni: match[1],
                    name: match[2].trim()
                }
            } else
                return null
        })
        .filter(item => item !== null)

    return {
        title: info.Title,
        list: parsedData
    }
}

module.exports = router;