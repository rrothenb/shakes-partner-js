const fs = require('fs')
const plays = fs.readdirSync('src/data')
let wordFreq = {}
let wordPairFreq = {}
let wordTripleFreq = {}
for (let play of plays) {
  //console.log(play)
  if (fs.statSync('src/data/' + play).isDirectory()) {
    const sceneNames = fs.readdirSync('src/data/' + play)
    for (let sceneName of sceneNames) {
      if (sceneName.startsWith('Act')) {
        //console.log(sceneName)
        const scenePath = '/Users/rickrothenberg/dev/shakes-partner-js/src/data/' + play + '/' + sceneName
        const scene = require(scenePath)
        for (let line of scene.lines) {
          if (line.speaker) {
            for (let sentence of line.text.split(/[.;:?!]/)) {
              //console.log(sentence)
              const words = sentence.toLowerCase().replace(/[, -]+/g,' ').split(' ').filter(word => word != '')
              if (words.length > 0) {
                //console.log(words)
                for (let i = 0; i < words.length; i++) {
                  let word = words[i]
                  if (wordFreq[word]) {
                    wordFreq[word]++
                  }
                  else {
                    wordFreq[word] = 1
                  }
                  if (i < words.length - 1) {
                    let phrase = words.slice(i, i+2).join(' ')
                    if (wordPairFreq[phrase]) {
                      wordPairFreq[phrase]++
                    }
                    else {
                      wordPairFreq[phrase] = 1
                    }
                  }
                  if (i < words.length - 2) {
                    let phrase = words.slice(i, i+3).join(' ')
                    if (wordTripleFreq[phrase]) {
                      wordTripleFreq[phrase]++
                    }
                    else {
                      wordTripleFreq[phrase] = 1
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
//console.log(wordFreq)
//console.log(wordPairFreq)
//console.log(wordTripleFreq)

let mostCommonWords = Object.keys(wordFreq).sort((a,b) => wordFreq[b] - wordFreq[a])
let mostCommon2WordPhrases = Object.keys(wordPairFreq).sort((a,b) => wordPairFreq[b] - wordPairFreq[a])
let mostCommon3WordPhrases = Object.keys(wordTripleFreq).sort((a,b) => wordTripleFreq[b] - wordTripleFreq[a])

for (let i = 0; i < 100; i++) {
  console.log(`${mostCommonWords[i]}, ${mostCommon2WordPhrases[i]}, ${mostCommon3WordPhrases[i]}`)
}