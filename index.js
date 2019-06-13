const express = require('express')
const request = require('request')
const openload = require('openload-link')
const bodyParser = require('body-parser')
const session = require('express-session')
const async = require('async')
const jsdom = require("jsdom")
const { JSDOM } = jsdom
global.document = new JSDOM(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Document</title>
    </head>
    <body>
        
    </body>
    </html>
`).window.document

express()
    // MiddleWare
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({extended: false}))
    .set('view engine', 'hjs')
    .use(express.static(__dirname + '/views'))
    .use(session({
        secret: 'anime is for gay',
        resave: false,
        saveUninitialized: true,
        cookie: { secure: true }
    }))
    
    // Routes
    .get('/', (req, res) => {
        if (!req.session.anime) {
            req.session.anime = {
                nome: 'Nessun anime recente',
                link: '#'
            }
        }
        res.render('index', {
            ultimoAnime: req.session.anime
        })
    })
    .post('/search', (req, res) => {
        let animeInput = req.body.animeInput
        let animeforce = req.body.animeforce
        let animehdita = req.body.animehdita
        let animeunity = req.body.animeunity
        let kuroneko = req.body.kuroneko

        async.parallel({
            one: function (callback) {
                let animeforceInput = animeInput.replace(' ', '+')
                request(`https://ww1.animeforce.org/?s=${animeforceInput}`, (err, res, body) => {
                    if (err) toast(err)
                    let results = []
                    let links = estraiLinksAnimeSearch(body)
                    for (let i = 0; i < links.length; i++) {
                        if (links[i].link.toString().includes('download-streaming')) {
                            results.push(links[i])
                        }
                    }
                    let resultsUnique = []
                    for (let i = 0; i < results.length; i++) {
                        if (!results[i].text.includes('<img')) {
                            resultsUnique.push(results[i])
                        }
                    }
                    callback(null, resultsUnique)
                })
            },
            two: function (callback) {
                callback(null, null)
            },
            three: function (callback) {
                callback(null, null)
            },
            four: function (callback) {
                callback(null, null)
            }
        }, function(err, results) {
            res.render('results', {
                animeforce: results.one,
                name: animeInput
            })
        })
        
    })
    .post('/animeforce', (req, res) => {
        let link = req.body.urlAnime
        if (containsNumbers(link.toString().substring(20, link.toString().length))) {
            request(link, (err, response, body) => {

            })
        } else {
            request(link, (err, response, body) => {
                let links = estraiLinksAnimePage(body)
                let unique = []

                for (let i = 0; i < links.length; i++) {
                    for (let j = i + 1; j < links.length; j++) {
                        if (links[i].link == links[j].link) {
                            links.splice(j, 1)
                        }
                    }
                }


                let episodeLinks = []
                for (let i = 0; i < links.length; i++) {
                    if (links[i].link.includes('.mp4') || links[i].link.includes('bit.ly')) {
                        episodeLinks.push(links[i])
                    }
                }
                let message
                if (!episodeLinks) {
                    message = 'Nessun Episodio Trovato!'
                }
                res.render('episodes', {
                    episodes: episodeLinks,
                    message
                })
            })

        }
    })
    .post('/download', (req, res) => {
        let link = req.body.urlAnime.replace('https', 'http')
        if (!link.includes('animeforce.org') && !link.includes('bit.ly')) {
            link = 'http://ww1.animeforce.org' + link
        }
        if (!link.includes('http')) {
            link = 'http:' + link
        }
        if (link.toString().includes('bit.ly')) {
            console.log(link)
            request(link, (err, resp, body) => {
                if (err) console.log(err)
                let newLink = resp.request.href.replace('https', 'http')
                if (newLink.toString().includes('.mp4&ol')) {
                    let doc = document.createElement("html")
                    doc.innerHTML = body
                    let openloadLink = doc.getElementsByTagName("iframe")[0].src
                    openload(openloadLink).then(openLink => {
                        res.render('downloadPage', {
                            link: openLink
                        })
                    }).catch(function () {
                        console.log("Error openload-link");
                    })
                    
                } else if (newLink.toString().includes('.mp4')) {
                    request(newLink, (err, resp, body) => {
                        let doc = document.createElement("html")
                        doc.innerHTML = body
                        let videoSource = doc.getElementsByTagName("source")[0].src
                        res.render('downloadPage', {
                            link: videoSource
                        })
                    })
                }
            })
        } else if (link.toString().includes('.mp4&ol')) {
            request(link, (err, resp, body) => {
                let doc = document.createElement("html")
                doc.innerHTML = body
                let openloadLink = doc.getElementsByTagName("iframe")[0].src
                openload(openloadLink).then(openLink => {
                    res.render('downloadPage', {
                        link: openLink
                    })
                }).catch(function () {
                    console.log("Error openload-link");
                })
                
            })
        } else if (link.toString().includes('.mp4')) {
            request(link, (err, resp, body) => {
                let doc = document.createElement("html")
                doc.innerHTML = body
                let videoSource = doc.getElementsByTagName('source')[0].src
                res.render('downloadPage', {
                    link: videoSource
                })
            })
        }
    })
    .post('/localPlayer', (req, res) => {
        let link = req.body.urlAnime.replace('https', 'http')
        if (!link.includes('animeforce.org') && !link.includes('bit.ly')) {
            link = 'http://ww1.animeforce.org' + link
        }
        if (!link.includes('http')) {
            link = 'http:' + link
        }
        if (link.toString().includes('bit.ly')) {
            request(link, (err, resp, body) => {
                if (err) console.log(err)
                let newLink = resp.request.href.replace('https', 'http')
                if (newLink.toString().includes('.mp4&ol')) {
                    let doc = document.createElement("html")
                    doc.innerHTML = body
                    let openloadLink = doc.getElementsByTagName("iframe")[0].src
                    openload(openloadLink).then(openLink => {
                        res.render('videoPlayer', {
                            video: openLink
                        })
                    }).catch(function () {
                        console.log("Error openload-link");
                    })
                    
                } else if (newLink.toString().includes('.mp4')) {
                    request(newLink, (err, resp, body) => {
                        let doc = document.createElement("html")
                        doc.innerHTML = body
                        let videoSource = doc.getElementsByTagName("source")[0].src
                        res.render('videoPlayer', {
                            video: videoSource
                        })
                    })
                }
            })
        } else if (link.toString().includes('.mp4&ol')) {
            request(link, (err, resp, body) => {
                let doc = document.createElement("html")
                doc.innerHTML = body
                let openloadLink = doc.getElementsByTagName("iframe")[0].src
                openload(openloadLink).then(openLink => {
                    res.render('videoPlayer', {
                        video: openLink
                    })
                }).catch(function () {
                    console.log("Error openload-link");
                })
                
            })
        } else if (link.toString().includes('.mp4')) {
            request(link, (err, resp, body) => {
                let doc = document.createElement("html")
                doc.innerHTML = body
                let videoSource = doc.getElementsByTagName('source')[0].src
                res.render('videoPlayer', {
                    video: videoSource
                })
            })
        }
    })

    .listen(process.env.PORT || 3000)




function estraiLinksAnimeSearch(rawHTML) {
    let doc = document.createElement("html")
    doc.innerHTML = rawHTML
    let links = doc.getElementsByTagName("a")
    let urls = []
    for (let i = 0; i < links.length; i++) {
        if (links[i].getAttribute("href") != null) {
            urls.push({
                link: links[i].getAttribute("href"),
                text: links[i].innerHTML
            })
        }
    }
    return (urls)
}
function estraiLinksAnimePage(rawHTML) {
    let doc = document.createElement("html")
    doc.innerHTML = rawHTML
    let links = doc.getElementsByTagName("a")
    let urls = []
    for (let i = 0; i < links.length; i++) {
        if (links[i].getAttribute("href") != null) {
            urls.push({
                link: links[i].getAttribute("href"),
                text: links[i].parentElement.parentElement.children[0].textContent
            })
        }
    }
    return (urls)
}

function containsNumbers(n) {
    return /\d/.test(n);
}