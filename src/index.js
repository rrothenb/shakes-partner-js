"use strict";

var APP_ID = undefined;//replace with 'amzn1.echo-sdk-ams.app.[your-unique-value-here]';

var AlexaSkill = require('./AlexaSkill');

var ShakesPartnerSkill = function () {
    AlexaSkill.call(this, APP_ID);
};

ShakesPartnerSkill.prototype = Object.create(AlexaSkill.prototype);
ShakesPartnerSkill.prototype.constructor = ShakesPartnerSkill;

ShakesPartnerSkill.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
};

ShakesPartnerSkill.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    newAskResponse(
        response,
        "Which of Shakespeare's characters would you like to read for today?",
        "You need to pick a character who you'll be reading for.");
};

ShakesPartnerSkill.prototype.eventHandlers.onIntent = function (intentRequest, session, response) {
    var character = session.attributes.character;
    var playName = session.attributes.play;
    var sceneName = session.attributes.scene;
    var lineNumber = session.attributes.lineNumber;

    var intent = intentRequest.intent;
    var intentName = (intent != null) ? intent.name : null;

    console.log(JSON.stringify(intent));

    if ("AMAZON.HelpIntent" == intentName) {
        return newAskResponse(
            response,
            "ShakesPartner allows you to practice any part from any Shakespeare play even when nobody else is" +
            " around.  ShakesPartner will ask you for the character and scene you want to read and it" +
            " will read for all the other parts.  It will also tell you when you've gotten a line " +
            "wrong.  If you forget your line simply say \"line\" and ShakesPartner will remind you " +
            "what your line is.  If you want to skip your line simply say \"continue\" and " +
            "ShakesPartner will move on.",
            "I don't recognize that.");
    }
    else if ("AMAZON.StopIntent" == intentName) {
        return newTellResponse(
            response,
            "Goodbye"
        );
    }
    else if ("AMAZON.CancelIntent" == intentName) {
        return newTellResponse(
            response,
            "Goodbye"
        );
    }
    if (character == null) {
        character = getStringValue(intentRequest);
        if (character == null) {
            return newAskResponse(
                response,
                "I don't recognize that.  You need to pick a character for whom you'll be reading.",
                "I don't recognize that.  You need to pick a character for whom you'll be reading.");
        }
        var playNames = require("./data/charactersToPlays")[character];
        if (playNames == null) {
            return newAskResponse(
                response,
                character + " is not a character that I recognize.  The closest matches I have are " + getClosestCharacters(character) + ".  Please try saying your character again.",
                "I don't recognize that.  You need to pick a character for whom you'll be reading.");
        }
        else if (playNames.length > 1) {
            session.attributes.character = character
            return newAskResponse(
                response,
                character + " is in multiple plays.  Which one do you want?",
                "I don't recognize that.  You need to pick a play from which you'll be reading for " + character);
        }
        else {
            playName = playNames[0];
            session.attributes.character = character
            session.attributes.play = playName;
            if (character == playName) {
                return newAskResponse(
                    response,
                    character + " is " + getSuperlative() + " character.  Which act and scene?",
                    "I don't understand that.  You need to pick an act and a scene from " + playName + " which you'll be reading from.  ");
            }
            else {
                return newAskResponse(
                    response,
                    character + " from " + playName + " is " + getSuperlative() + " character.  Which act and scene?",
                    "I don't understand that.  You need to pick an act and a scene from " + playName + " which you'll be reading from.  ");
            }
        }
    }
    else if (playName == null) {
        playName = getStringValue(intentRequest);
        if (playName == null) {
            return newAskResponse(
                response,
                "I don't recognize that.  You need to pick a play from which you'll be reading for " + character,
                "I don't recognize that.  You need to pick a play from which you'll be reading for " + character);
        }
        var playNames = require("./data/charactersToPlays")[character];
        if (playNames.indexOf(playName) > -1) {
            session.attributes.play = playName;
            return newAskResponse(
                response,
                character + " from " + playName + " is a great character.  Which act and scene?",
                "I don't understand that.  You need to pick an act and a scene from " + playName + " which you'll be reading from");
        }
        else {
            return newAskResponse(
                response,
                character + " doesn't appear in " + playName + ".  Please pick an appropriate play.  You can choose from " + playNames.join(" or "),
                "I don't recognize that.  You need to pick a play from which you'll be reading for " + character);
        }
    }
    else if (sceneName == null) {
        sceneName = getSceneValue(intentRequest);
        if (sceneName == null) {
            return newAskResponse(
                response,
                "I don't recognize that.  You need to pick an act and a scene from " + playName,
                "I don't recognize that.  You need to pick an act and a scene from " + playName);
        }
        var startingText = [];
        session.attributes.scene = sceneName;
        try {
            if (collectLines(session, startingText)) {
                delete session.attributes.scene;
                var firstSceneWithCharacter = require("./data/" + playName + "/charactersToScenes")[character][0];
                return newAskResponse(
                    response,
                    "You need to pick an act and a scene from " + playName + " that " + character + " actually appears in.  The first scene " + character + " is in is " + firstSceneWithCharacter,
                    "I don't recognize that.  You need to pick an act and a scene from " + playName);
            } else {
                var sceneDef = require("./data/" + playName + "/" + sceneName);
                var responseText = playName + " by william shakespeare.  " + sceneName + ".  " + sceneDef.location;
                if (!responseText.endsWith(".")) {
                    responseText += ".";
                }
                responseText += "  " + startingText.join(" ");
                return newAskResponse(
                    response,
                    responseText,
                    "You need to read your line.");
            }
        }
        catch (e) {
            session.attributes.scene = null;
            var firstSceneWithCharacter = require("./data/" + playName + "/charactersToScenes")[character][0];
            return newAskResponse(
                response,
                "What I thought I heard you say was " + sceneName + ", but that can't be right since that doesn't even occur in " + playName +
                ".  Why don't you try again?  Incidentally, the first scene that " + character + " appears in is " + firstSceneWithCharacter +
                ".  Just so you know.",
                "I don't recognize that.  You need to pick an act and a scene from " + playName);
        }

    }
    var lines = require("./data/" + playName + "/" + sceneName).lines;
    var doubleMetaphone = require('double-metaphone');
    var yourLine = lines[lineNumber].text.replace(/\\[[^\\]]*\\]/,"");
    var words = getStringValue(intentRequest);
    if (intentName == "ContinueIntent") {
        session.attributes.lineNumber = lineNumber+1;
        var nextLines = [];
        if (collectLines(session, nextLines)) {
            return newTellResponse(
                response,
                "You did it!  You finished the scene!  You did " + getSuperlative() + " job!");
        }
        else {
            return newAskResponse(
                response,
                nextLines.join(" "),
                "Say your line");
        }
    }
    else if (intentName == "ProvideLineIntent") {
        return newAskResponse(
            response,
            yourLine,
            "Say your line");
    }
    else if (words != null) {
        var yourLineDM = doubleMetaphone(yourLine).join("");
        console.log("Expected:" + yourLine);
        console.log(yourLineDM);
        console.log("Given: " + words);
        var wordsDM = doubleMetaphone(words).join("");
        console.log(wordsDM);
        var levenshtein = require('fast-levenshtein');
        var distance = levenshtein.get(yourLineDM, wordsDM);
        var percentDistance = distance*100/yourLineDM.length;
        percentDistance = percentDistance/(1.0/yourLineDM.length+1);
        console.log("Distance :" + distance + ", length: " + yourLineDM.length + ", percentDistance: " + percentDistance);
        if (percentDistance < 25) {
            session.attributes.lineNumber = lineNumber+1;
            var nextLines = [];
            if (collectLines(session, nextLines)) {
                return newTellResponse(
                    response,
                    "You did it!  You finished the scene!  You did " + getSuperlative() + " job!");
            }
            else {
                return newAskResponse(
                    response,
                    nextLines.join(" "),
                    "Say your line");
            }
        }
        else {
            if (percentDistance < 50) {
                return newAskResponse(
                    response,
                    "Close but not quite.  Try saying your line again",
                    "Say your line");
            }
            else if (percentDistance < 75) {
                return newAskResponse(
                    response,
                    "Nope.  You may want to study the text a little bit more",
                    "Say your line");
            }
            return newAskResponse(
                response,
                "Not even close.  Go back and memorize your line correctly",
                "Say your line");
        }
    }
    else {
        return newAskResponse(
            response,
            "You've got to say something",
            "Say your line");
    }
};

ShakesPartnerSkill.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
};

function getStringValue(request) {
    var intent = request.intent;
    var name = intent.name;
    if (name == "PlayIntent") {
        return intent.slots["Play"].value.toLowerCase();
    }
    else if (name == "CharacterIntent") {
        return intent.slots["Character"].value.toLowerCase();
    }
    else if (name == "LineIntent") {
        return intent.slots["Words"].value.toLowerCase();
    }
    else {
        return null;
    }
}

function getSceneValue(request) {
    var intent = request.intent;
    var name = intent.name;
    if (name == "SceneIntent") {
        return "Act " + intent.slots["Act"].value + ", scene " + intent.slots["Scene"].value;
    }
    else {
        return null;
    }
}

function newTellResponse(response, stringOutput) {
    console.log("Response: " + stringOutput);
    var speechOutput = {
        speech: stringOutput,
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    };
    response.tell(speechOutput);
}

function newAskResponse(response, stringOutput, repromptText) {
    console.log("Response: " + stringOutput);
    var speechOutput = {
        speech: stringOutput,
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    };
    var repromptOutput = {
        speech: repromptText,
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    };
    response.ask(speechOutput, repromptOutput);
}

function getSuperlative() {
    var superlatives = [
        "a great",
        "a terrific",
        "one awesome",
        "an outstanding",
        "a wonderful",
        "one hella tight",
        "a brilliant",
        "a fascinating",
        "an excellent",
        "a marvelous",
        "a superb",
        "an exceptional",
        "a splendid",
        "a stupendous",
        "an exquisite",
        "a spectacular",
        "a commendable",
        "a top notch",
        "a swell",
        "a dandy",
        "a nifty",
        "a fine",
        "a stellar",
        "a grand",
        "an exemplary",
        "a prime",
        "a first class",
        "a delightful",
        "a sublime",
        "an impressive",
        "a glorious",
        "a magnificent"];
    return superlatives[Math.floor(Math.random()*superlatives.length)];

}

function collectLines(session, collectedLines) {
    var character = session.attributes.character;
    var lineNumber = session.attributes.lineNumber;
    var playName = session.attributes.play;
    var sceneName = session.attributes.scene;
    var collectedLineSize = 0;
    var linesTruncated = false;
    if (lineNumber == null) {
        lineNumber = 0;
    }
    var lines = require("./data/" + playName + "/" + sceneName).lines;
    for (var i=lineNumber;i<lines.length;i++) {
        var text = lines[i];
        if (text.speaker != null && text.speaker == character) {
            if (linesTruncated) {
                collectedLines.unshift("skipping ahead.");
            }
            session.attributes.lineNumber = i;
            return false;
        }
        else {
            var line = text.text.replace(/:/g, ". ");
            if (line.match(/^.*[a-zA-Z]$/)) {
                line += ".";
            }
            while (collectedLineSize + line.length > 7900 && collectedLines.length > 0) {
                collectedLineSize -= collectedLines.shift().length;
                linesTruncated = true;
            }
            collectedLines.push(line);
            collectedLineSize += line.length;
        }
    }
    return true;
}

function getClosestCharacters(character) {
    var doubleMetaphone = require('double-metaphone');
    var characterDM = doubleMetaphone(character).join("");
    var characters = Object.keys(require("./data/charactersToPlays"));
    var levenshtein = require('fast-levenshtein');
    var sortedCharacters = characters.sort(function (a, b) {
        var aDistance = levenshtein.get(characterDM, doubleMetaphone(a).join(""));
        var bDistance = levenshtein.get(characterDM, doubleMetaphone(b).join(""));
        return aDistance - bDistance;
    });
    return sortedCharacters[0] + ", " + sortedCharacters[1] + ", and " + sortedCharacters[2];
}

exports.handler = function (event, context) {
    var skill = new ShakesPartnerSkill();
    skill.execute(event, context);
};
