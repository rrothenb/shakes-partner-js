var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);
chai.should();

var runSkill = require('../src').handler;

describe("Shakes Partner", function() {

    beforeEach(function() {
        response = [];
    });

    it("should handle a typical session", function() {
        run("CharacterIntent", {Character: "bernardo"});
        run("SceneIntent", {Act: "1", Scene: "1"});
        run("LineIntent", {Words: "Who's there"});
        run("ProvideLineIntent");
        run("ContinueIntent");

        return Promise.all([
            response[0].should.eventually.match(
                /bernardo from hamlet is .* character.  Which act and scene\?/),
            response[1].should.eventually.equal(
                "hamlet by william shakespeare.  Act 1, scene 1.  Elsinore. A platform before " +
                "the castle.  FRANCISCO at his post. Enter to him BERNARDO."),
            response[2].should.eventually.equal(
                "Nay, answer me.  stand, and unfold yourself."),
            response[3].should.eventually.equal(
                "Long live the king!"),
            response[4].should.eventually.equal(
                "Bernardo")
        ]);
    });
    it("should handle the scenario with doctor butts");
    it("should prompt the user for a play if the character appears in multiple plays");
    it("should tell you the first scene if you give it a scene the character doesn't appear in");
    it("should tell you if you get your line wrong");
    it("should accept a line that's only slightly wrong");
    it("should handle getting a play when it expects a character");
    it("should handle getting a scene when it expects a character");
    it("should handle getting a scene when it expects a play");
    it("should handle getting a character when it expects a play");
    it("should handle getting a play when it expects a scene");
    it("should handle getting a scene when it expects a line");
    it("should handle plays with a roman numeral");
    it("should handle characters with a roman numeral");
    it("should not expect stage directions in a given line");
    it("should not repeat the play in the prompt for a scene if the character only appears in one play and the name of the play is the name of the character");
    it("should let the user know how close the line is to correct");
    it("should let the user know the closest characters it knows when it doesn't know the given on");
    it("should limit spoken lines to no more than 8000 characters");
    it("should preface the spoken lines with an indication if it had to limit them");
});


var previousSessionAttributes;

var response = [];

function run(intentName, slots) {
    for(var key in slots) {
        slots[key] = {value: slots[key]};
    }
    var promise = new Promise(function(resolve,reject){
        var event = {
            session: {
                sessionId: 'sessionId',
                application: {
                    applicationId: 'applicationId'
                }
            },
            request: {
                type: 'IntentRequest',
                intent: {
                    name: intentName,
                    slots: slots
                }
            }
        };
        var context = {
            succeed: function(response) {
                previousSessionAttributes = response.sessionAttributes;
                resolve(response.response.outputSpeech.text);
            },
            fail: reject
        };
        if (response.length > 0) {
            response.slice(-1)[0].then(function() {
                event.session.attributes = previousSessionAttributes;
                runSkill(event, context);
            });
        }
        else {
            runSkill(event, context);
        }
    })
    response.push(promise);
}