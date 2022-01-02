const EXIT_MESSAGE = 'Thanks for playing! Goodbye.';
const LAUNCH_MESSAGE = "Welcome to Fizz Buzz. Please say 'help' to hear the instructions. If you would like to begin the game, say 'start'!";
const FALLBACK_LAUNCH_MESSAGE = "Sorry, I'm not sure what you meant. Please say 'help' to hear the instructions or say 'start' if you would like to begin the game!";
const FALLBACK_GAME_MESSAGE = "Sorry, I'm not sure what you meant. Try responding with a number, fizz, buzz, or fizzbuzz.";
const FALLBACK_GAME_REPROMPT = 'Please respond with a number, fizz, buzz, or fizzbuzz.';
const LOSE_MESSAGE = ["Sorry, you lost. ", "Better luck next time! ", "Sorry, you lost. Maybe try Siri for a better chance of winning! "];
const LOSE_MESSAGE_FOLLOWUP = "The correct answer was num1. Your highscore is num2 rounds. Would you like to play again?";
const CONTINUE_MESSAGE = "Say 'yes' to play, 'no' to quit, or 'help' to hear the instructions.";
const HELP_MESSAGE = 'Starting from 1, we take turns counting upwards. Any number divisible by three should be replaced by the word fizz, any number divisible by five would be replaced by the word buzz, and numbers divisible by 15 would be replaced with fizz buzz. Would you like to start playing?';
const ERROR_MESSAGE = 'Sorry, there was an error.';
const YES_MESSAGE = ["Awesome! I'll go first... 1.", "Great! I'll start with 1."];
const NEXT_VALUE_MESSAGE = ["num. Your turn!", "num", "num. You go next!"];

var gameRunning = false; //set gameRunning flag to false initially
var nextNum = 2; //stores the number to be said by the user
var nextValueAlexa = '1'; //stores Alexa's response
var highscore = 0;

const Alexa = require('ask-sdk');

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.isNewSession(handlerInput.requestEnvelope) 
            || Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        gameRunning = false; //set game running flag to false
        
        return handlerInput.responseBuilder
            .speak(LAUNCH_MESSAGE)
            .reprompt(CONTINUE_MESSAGE)
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak(HELP_MESSAGE)
            .reprompt(CONTINUE_MESSAGE)
            .getResponse();
    }
};

//user responds does not want to play
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.NoIntent');
    },
    handle(handlerInput) {
        gameRunning = false; //set game running flag to false

        return handlerInput.responseBuilder
            .speak(EXIT_MESSAGE)
            .withShouldEndSession(true)
            .getResponse();
    }
};

//user responds with yes or start (indicating the start of the game)
const StartIntentHandler = {
    canHandle(handlerInput) {
        //game can only be started while it is not already running
        return !gameRunning
            && Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.YesIntent';
    },
    handle(handlerInput) {
        gameRunning = true; //set game running flag to true
        
        //set up launch variables
        nextNum = 2;
        nextValueAlexa = 1; 

        return handlerInput.responseBuilder
            .speak(randomResponse(YES_MESSAGE))
            .reprompt(CONTINUE_MESSAGE)
            .getResponse();
    }
};

//game logic for fizz buzz
const NextValueIntentHandler = {
    canHandle(handlerInput) {
        return gameRunning
            && Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'NextValueIntent';
    },
    handle(handlerInput) {
        const correctResponse = fizzBuzzResponse(nextNum);
        const guessNum = parseInt(Alexa.getSlotValue(handlerInput.requestEnvelope, 'number'), 10);
        const guessFizzBuzz = Alexa.getSlotValue(handlerInput.requestEnvelope, 'fizzbuzz');
        const isNum = typeof correctResponse === "number"

        //case where the user response is correct
        if ((isNum && guessNum === correctResponse) || (!isNum && guessFizzBuzz === correctResponse)) {
            //Assign Alexa's response to nextNum++ and iterate the next number by 2
            nextValueAlexa = (fizzBuzzResponse(nextNum + 1));
		    nextNum += 2;
            
            return handlerInput.responseBuilder
		    .speak(randomResponse(NEXT_VALUE_MESSAGE).replace("num", nextValueAlexa))
		    .reprompt(randomResponse(NEXT_VALUE_MESSAGE).replace("num", nextValueAlexa))
		    .getResponse();
		//user response is incorrect
        } else {
            gameRunning = false; //set game running flag to false
            highscore = Math.max((nextNum - 1), highscore);
            
            return handlerInput.responseBuilder
		    .speak(randomResponse(LOSE_MESSAGE) + LOSE_MESSAGE_FOLLOWUP.replace("num1", fizzBuzzResponse(nextNum)).replace("num2", highscore))
		    .reprompt(CONTINUE_MESSAGE)
		    .getResponse();
        }    
    }
};

// To handle fallback intents
const FallbackHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent'
            || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.YesIntent'
            || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.NoIntent');
    },
    handle(handlerInput) {

        //if the game is running
        if (gameRunning) {
            return handlerInput.responseBuilder
                .speak(FALLBACK_GAME_MESSAGE)
                .reprompt(FALLBACK_GAME_REPROMPT)
                .getResponse();
        }

        //if the game is not running
        return handlerInput.responseBuilder
            .speak(FALLBACK_LAUNCH_MESSAGE)
            .reprompt(CONTINUE_MESSAGE)
            .getResponse();
    }
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        gameRunning = false; //set game running flag to false
        console.log("Session ended with reason: ${handlerInput.requestEnvelope.request.reason}"); //for debugging
        return handlerInput.responseBuilder.getResponse();
    }
};

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`Error handled: ${error.message}`);

        return handlerInput.responseBuilder
            .speak(ERROR_MESSAGE)
            .reprompt(ERROR_MESSAGE)
            .getResponse();
    }
};

//helper function to find the correct response to a number/value
function fizzBuzzResponse(num) {
    if (num % 3 === 0 && num % 5 !== 0) return "fizz";
    if (num % 5 === 0 && num % 3 !== 0) return "buzz";
    if (num % 3 === 0 && num % 5 === 0) return "fizz buzz";
    else return num;
}

//helper function to randomize Alexa's responses
function randomResponse(data) {
    var i = 0;
    i = Math.floor(Math.random() * data.length);
    return(data[i]);
}

exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        StartIntentHandler,
        NextValueIntentHandler,
        FallbackHandler,
        SessionEndedRequestHandler)
    .addErrorHandlers(ErrorHandler)
    .lambda();
