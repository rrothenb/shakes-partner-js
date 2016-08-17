var APP_ID = undefined;//replace with 'amzn1.echo-sdk-ams.app.[your-unique-value-here]';

var AlexaSkill = require('./AlexaSkill');

var ShakesPartnerSkill = function () {
    AlexaSkill.call(this, APP_ID);
};

ShakesPartnerSkill.prototype = Object.create(AlexaSkill.prototype);
ShakesPartnerSkill.prototype.constructor = ShakesPartnerSkill;

ShakesPartnerSkill.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
};

ShakesPartnerSkill.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("ShakesPartnerSkill onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);

    newAskResponse(
        response,
        "Which of Shakespeare's characters would you like to read for today?",
        "You need to pick a character who you'll be reading for.");
};

ShakesPartnerSkill.prototype.eventHandlers.onIntent = function (intentRequest, session, response) {
    console.log("ShakesPartnerSkill onIntent requestId: " + intentRequest.requestId + ", sessionId: " + session.sessionId);
    var character = session.attributes.character;
    var playName = session.attributes.play;
    var sceneName = session.attributes.scene;
    var lineNumber = session.attributes.lineNumber;

    var intent = intentRequest.intent;
    var intentName = (intent != null) ? intent.name : null;

    console.log("intentRequest: " + JSON.stringify(intentRequest));
    console.log(JSON.stringify(intent));
    console.log("character: " + character);
    console.log("playName: " + playName);
    console.log("sceneName: " + sceneName);
    console.log("lineNumber: " + lineNumber);

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
        console.log("character: " + character);
        if (character == null) {
            return newAskResponse(
                response,
                "I don't recognize that.  You need to pick a character for whom you'll be reading.",
                "I don't recognize that.  You need to pick a character for whom you'll be reading.");
        }
        console.log("about to getPlays for " + character);
        var playNames = require("./data/charactersToPlays")[character];
        console.log("plays: " + playNames);
        if (playNames == null) {
            return newAskResponse(
                response,
                character + " is not a character that I recognize.  The closest matches I have are " + Characters.getClosestCharacters(character) + ".  Please try saying your character again.",
                "I don't recognize that.  You need to pick a character for whom you'll be reading.");
        }
        else if (playNames.length > 1) {
            console.log("num plays: " + playNames.length);
            session.attributes.character = character
            return newAskResponse(
                response,
                character + " is in multiple plays.  Which one do you want?",
                "I don't recognize that.  You need to pick a play from which you'll be reading for " + character);
        }
        else {
            playName = playNames[0];
            console.log("playName: " + playName);
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
        console.log(sceneName);
        if (sceneName == null) {
            return newAskResponse(
                response,
                "I don't recognize that.  You need to pick an act and a scene from " + playName,
                "I don't recognize that.  You need to pick an act and a scene from " + playName);
        }
        var startingText = [];
        session.attributes.scene = sceneName;
        if (collectLines(session, startingText)) {
            delete session.attributes.scene;
            var firstSceneWithCharacter = require("./data/" + playName + "/charactersToScenes.json")[character][0];
            return newAskResponse(
                response,
                "You need to pick an act and a scene from " + playName + " that " + character + " actually appears in.  The first scene " + character + " is in is " + firstSceneWithCharacter,
                "I don't recognize that.  You need to pick an act and a scene from " + playName);
        } else {
            var sceneDef = require("./data/" + playName + "/" + sceneName + ".json");
            var responseText = playName + " by william shakespeare.  " + sceneName + ".  " + sceneDef.location;
            if (!responseText.endsWith(".")) {
                responseText += ".";
            }
            responseText += "  " + startingText.join(" ");
            console.log(responseText);
            console.log("length: " + responseText.length);
            return newAskResponse(
                response,
                responseText,
                "You need to read your line.");
        }

    }
};

ShakesPartnerSkill.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("onSessionEnded requestId: " + sessionEndedRequest.requestId + ", sessionId: " + session.sessionId);
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
    console.log(name);
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
    console.log(playName);
    console.log(sceneName);
    var lines = require("./data/" + playName + "/" + sceneName + ".json").lines;
    console.log(lines.length);
    console.log(lineNumber);
    console.log(character);
    for (var i=lineNumber;i<lines.length;i++) {
        var text = lines[i];
        console.log(text);
        if (text.speaker != null && text.speaker == character) {
            console.log("collectedLineSize: " + collectedLineSize);
            console.log("lineNumber: " + i);
            if (linesTruncated) {
                collectedLines.unshift("skipping ahead.");
            }
            session.attributes.lineNumber = i;
            return false;
        }
        else {
            var line = text.text.replace(/:/g, ". ");
            if (line.match(/.*[a-zA-Z]/)) {
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
    console.log(collectedLines.length);
    return true;
}

exports.handler = function (event, context) {
    var skill = new ShakesPartnerSkill();
    console.log("event:");
    console.log(event);
    console.log("context:");
    console.log(context);
    skill.execute(event, context);
};
