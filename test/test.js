var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);
chai.should();

var runSkill = require('../src').handler;

describe("Shakes Partner", function () {

    beforeEach(function () {
        response = [];
        previousSessionAttributes = {};
    });

    it("should handle a typical session", function () {
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
                "Bernardo.")
        ]);
    });
    it("should handle the scenario with doctor butts", function () {
        run("CharacterIntent", {Character: "doctor butts"});
        run("SceneIntent", {Act: "5", Scene: "2"});
        run("LineIntent", {Words: "This is a piece of malice. I am glad I came this way so happily.  the king Shall understand it presently."});
        run("LineIntent", {Words: "Ill show your grace the strangest sight"});
        run("LineIntent", {Words: "I think your highness saw this many a day."});
        run("LineIntent", {Words: "There, my lord.  The high promotion of his grace of Canterbury; Who holds his state at door, 'mongst pursuivants, Pages, and footboys."});

        return Promise.all([
            response[0].should.eventually.match(
                /doctor butts from henry the eighth is .* character.  Which act and scene\?/),
            response[1].should.eventually.equal(
                "henry the eighth by william shakespeare.  Act 5, scene 2.  Before the councilchamber. Pursuivants, Pages,  and c.  Enter CRANMER. I hope I am not too late and yet the gentleman, That was sent to me from the council, prayd me To make great haste. All fast what means this Ho! Who waits there Sure, you know me. Enter Keeper. Yes, my lord But yet I cannot help you. Why. Enter DOCTOR BUTTS. Your grace must wait till you be calld for. So."),
            response[2].should.eventually.equal(
                "Exit. [Aside]Tis Butts, The kings physician.  as he passd along, How earnestly he cast his eyes upon me! Pray heaven, he sound not my disgrace! For certain, This is of purpose laid by some that hate me God turn their hearts! I never sought their malice To quench mine honour.  they would shame to make me Wait else at door, a fellowcounsellor, Mong boys, grooms, and lackeys. But their pleasures Must be fulfilld, and I attend with patience. Enter the KING HENRY VIII and DOCTOR BUTTS at a window above."),
            response[3].should.eventually.equal(
                "Whats that, Butts."),
            response[4].should.eventually.equal(
                "Body o me, where is it."),
            response[5].should.eventually.match(
                /You did it!  You finished the scene!  .* job!/),
        ]);
    });
    it("should prompt the user for a play if the character appears in multiple plays", function () {
        run("CharacterIntent", {Character: "francisco"});
        run("PlayIntent", {Play: "othello"});
        run("PlayIntent", {Play: "hamlet"});

        return Promise.all([
            response[0].should.eventually.equal(
                "francisco is in multiple plays.  Which one do you want?"),
            response[1].should.eventually.equal(
                "francisco doesn't appear in othello.  Please pick an appropriate play.  You can choose from hamlet or the tempest"),
            response[2].should.eventually.match(
                /francisco from hamlet is .* character.  Which act and scene\?/)
        ]);
    });
    it("should tell you the first scene if you give it a scene the character doesn't appear in", function () {
        run("CharacterIntent", {Character: "hamlet"});
        run("SceneIntent", {Act: "1", Scene: "1"});

        return response[1].should.eventually.equal(
            "You need to pick an act and a scene from hamlet that hamlet actually appears in.  The first scene hamlet is in is Act 1, scene 2");
    });
    it("should tell you if you get your line wrong", function () {
        run("CharacterIntent", {Character: "bernardo"});
        run("SceneIntent", {Act: "1", Scene: "1"});
        run("LineIntent", {Words: "Yo. What up?"});

        return response[2].should.eventually.equal(
            "Nope.  You may want to study the text a little bit more");
    });
    it("should accept a line that's only slightly wrong", function () {
        run("CharacterIntent", {Character: "sicinius"});
        run("SceneIntent", {Act: "3", Scene: "1"});
        run("LineIntent", {Words: "piss new father"});

        return response[2].should.eventually.equal(
            "Ha! what is that. It will be dangerous to go on.  no further. What makes this change. The matter. Hath he not passd the noble and the common. Cominius, no. Have I had childrens voices. Tribunes, give way he shall to the marketplace. The people are incensed against him.");
    });
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


var previousSessionAttributes = {};

var response = [];

function run(intentName, slots) {
    for (var key in slots) {
        slots[key] = {value: slots[key]};
    }
    var promise = new Promise(function (resolve, reject) {
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
            succeed: function (response) {
                previousSessionAttributes = response.sessionAttributes;
                resolve(response.response.outputSpeech.text);
            },
            fail: reject
        };
        if (response.length > 0) {
            response.slice(-1)[0].then(function () {
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