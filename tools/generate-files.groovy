import groovy.json.*
import java.nio.file.Paths

JsonSlurper slurper = new JsonSlurper()
def result

Paths.get('shakespeare.2.json').withReader { reader ->
    result = slurper.parse(reader)
}

enum RomanDigits {
    I(1), V(5), X(10), L(50), C(100), D(500), M(1000);

    private magnitude;
    private RomanDigits(magnitude) { this.magnitude = magnitude }

    String toString() { super.toString() + "=${magnitude}" }

    static BigInteger parse(String numeral) {
        assert numeral != null && !numeral.empty
        def digits = (numeral as List).collect {
            RomanDigits.valueOf(it)
        }
        def L = digits.size()
        (0..<L).inject(0g) { total, i ->
            def sign = (i == L - 1 || digits[i] >= digits[i+1]) ? 1 : -1
            total + sign * digits[i].magnitude
        }
    }
}

def convertRomanNumerals = { name ->
    def words = [
          "the zeroth",
          "the first",
          "the second",
          "the third",
          "the fourth",
          "the fifth",
          "the sixth",
          "the seventh",
          "the eighth",
          "the ninth",
          "the tenth",
          "the eleventh",
          "the twelfth",
          "the thirteenth",
          "the fourteenth",
          "the fifteenth",
          "the sixteenth",
          "the seventeenth",
          "the eighteenth",
          "the nineteenth",
          "the twentieth"
    ]
    def matcher = name =~ /.*\b([vxVX]|[ivxIVX][ivxIVX]+)\b.*/
    if (matcher.matches()) {
        name.replaceFirst(matcher.group(1),words[RomanDigits.parse(matcher.group(1).toUpperCase())])
    }
    else {
        name
    }
}

def characters = [:]
def plays = []

def play = [:]
def scene = [:]
def line = [:]
def scenes = []

int actNumber
int sceneNumber
String sceneName

for (def entry : result) {
    String speaker = entry.speaker.toLowerCase()
    speaker = convertRomanNumerals(speaker)
    String playName = entry.play_name.toLowerCase()
    playName = convertRomanNumerals(playName)
    String text = entry.text_entry
    def (playNumber, sceneNumberPart, lineNumber) = entry.line_number.tokenize('.')
    if (play.playName != playName) {
        play = [playName:playName,
                characterData: [:]]
        plays << play
    }
    if (text.startsWith('ACT ')) {
        actNumber = RomanDigits.parse(text.substring(4))
    }
    else if (text.startsWith('SCENE ')) {
        String location = text.replaceFirst('[^.]*. *','')
        sceneNumber = RomanDigits.parse(text.substring(6).replaceFirst('[.:].*$',''))
        sceneName = "Act ${actNumber}, scene ${sceneNumber}"
        scene = [sceneName: sceneName,
                 playName: playName,
                 location: location,
                 lines: []]

        scenes << scene
    }
    else if (!playNumber) {
        scene.lines << [text: text]
    }
    else {
        if (line.speaker == speaker) {
            line.text += ' ' + entry.text_entry
        }
        else {
            if (speaker == "") {
                speaker = null
            }
            line = [speaker: speaker, text: entry.text_entry]
            if (speaker) {
                if (play.characterData[speaker]) {
                    play.characterData[speaker] << sceneName
                }
                else {
                    play.characterData[speaker] = [sceneName] as TreeSet
                }
                if (characters[speaker]) {
                    characters[speaker] << playName
                }
                else {
                    characters[speaker] = [playName] as TreeSet
                }
            }
            scene.lines << line
        }
    }
}

File charactersFile = new File("../src/data/charactersToPlays.json")
charactersFile.write JsonOutput.prettyPrint(JsonOutput.toJson(characters))

for (def playDef : plays) {
    File playDir = new File("../src/data/${playDef.playName}")
    playDir.mkdirs()
    File charactersToScenesFile = new File("../src/data/${playDef.playName}/charactersToScenes.json")
    charactersToScenesFile.write JsonOutput.prettyPrint(JsonOutput.toJson(playDef.characterData))
}

for (def sceneDef : scenes) {
    File sceneFile = new File("../src/data/${sceneDef.playName}/${sceneDef.sceneName}.json")
    sceneFile.write JsonOutput.prettyPrint(JsonOutput.toJson(sceneDef))
}
