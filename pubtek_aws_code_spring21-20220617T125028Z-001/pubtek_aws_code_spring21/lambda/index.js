const Alexa = require('ask-sdk-core');
const i18n = require('i18next');
const axios = require('axios');
const Util = require('./util.js');


// This is where can store all our response messages and strings 
const languageStrings = {
    en: {
        translation: {
            WELCOME_MSG: 'Hi! How can I help you?',
            RESPONSE_MSG: 'Your server will be with you shortly',
            ERROR_MSG: 'There was a problem sending message to the server',
            NOTHING_MSG: 'Nothing Happened',
            DRINK_MSG: 'Lets order some drinks.',
            GAME_NOISE: `<audio src='soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_countdown_loop_32s_full_01'/>`
        }
    }
};
            
            
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speechText = handlerInput.t('WELCOME_MSG');
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(handlerInput.t('WELCOME_MSG'))
            .getResponse();
    }
};

const readLinesHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'readLines';
    },
    async handle(handlerInput) {
        
        const response = handlerInput.t(`<break time="1.5s"/>` + " Done. " + `<break time="1.5s"/>` + "Just kidding. Your drinks will behere in two minutes." + `<break time="1.5s"/>` + "One photonic coming your way.")
        
        return handlerInput.responseBuilder
            .speak(response)
            .getResponse(); 
       
    }
    
};

async function feedbackGet(deviceId, service, food, overall, comment, bad) {
  return axios.post("http://18.206.56.17:4007/feedback", {
        "UID" : deviceId,
        "ServerRating" : service,
        "FoodRating" : food,
        "otherRating" : overall,
        "Good" : comment,
        "Bad" : bad
  });
}

const feedbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'feedbackIntent';
    },
    async handle(handlerInput) {
        const deviceId = handlerInput.requestEnvelope.context.System.device.deviceId;
        const {requestEnvelope, responseBuilder} = handlerInput;
        const {intent} = requestEnvelope.request;
        
        const service = Alexa.getSlotValue(requestEnvelope, 'service');
        const food = Alexa.getSlotValue(requestEnvelope, 'food');
        const overall = Alexa.getSlotValue(requestEnvelope, 'overall');
        const comment = Alexa.getSlotValue(requestEnvelope, 'message');
        const bad = Alexa.getSlotValue(requestEnvelope, 'bad');
        
        const response = await feedbackGet(deviceId, service, food, overall, comment, bad);
        
        return handlerInput.responseBuilder
            .speak(`${response.data}`)
            .getResponse(); 
       
    }
    
};

// trivia post function
async function triviaGet() {
  const url = "http://18.206.56.17:4007/trivia";
  
  var config = {
        timeout: 6500,
        headers: {'Accept': 'application/json'}
    };

    async function getJsonResponse(url, config){
        const response = await axios.post(url, config);
        return response.data;
    }

    return getJsonResponse(url, config).then((result) => {
        return result;
    }).catch((error) => {
        return null;
    });
}

// trivia intent handler
const triviaIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'triviaIntent';
    },
    async handle(handlerInput) {
        
        const {requestEnvelope, responseBuilder} = handlerInput;
        const {intent} = requestEnvelope.request;
        let questionResponse = ' ';
        let answerResponse = ' ';
        let ar = ' ';
        let br = ' ';
        let cr = ' ';
        let dr = ' ';
        
        var obj = await triviaGet();
        
        //var question = JSON.stringify(obj, ['Question', 'A', 'B', 'C', 'D']);
        const audioUrl = Util.getS3PreSignedUrl("Media/game_music.mp3").replace(/&/g,'&amp;');
        
        var question = JSON.stringify(obj, ['Question']);
        var a = JSON.stringify(obj, ['A']);
        var b = JSON.stringify(obj, ['B']);
        var c = JSON.stringify(obj, ['C']);
        var d = JSON.stringify(obj, ['D']);
        var answer = JSON.stringify(obj, ['Answer']);
            
        questionResponse = handlerInput.t(question);
        answerResponse = handlerInput.t(answer);
        ar = handlerInput.t(a);
        br = handlerInput.t(b);
        cr = handlerInput.t(c);
        dr = handlerInput.t(d);
        
        return handlerInput.responseBuilder
            .speak(questionResponse + " is it A. " + ar + `<break time="0.5s"/>`+ " B. " + br + `<break time="0.5s"/>` + " C. "+ cr + " or D." + dr + `<audio src="${audioUrl}"/>` + "the answer is " + `<break time="0.5s"/>`+ answerResponse)
            .reprompt("Say play again for another trivia question")
            .getResponse(); 
    }
    
}


// drink order post function
async function drinkGet(deviceId, drink) {
  return axios.post("http://18.206.56.17:4007/drinkOrder", {
      "UID": deviceId,
      "Beverage": drink
  });
}

// drink order intent handler 
const drinkOrderIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'drinkOrderIntent';
    },
    async handle(handlerInput) {
        const deviceId = handlerInput.requestEnvelope.context.System.device.deviceId;
        const {requestEnvelope, responseBuilder} = handlerInput;
        const {intent} = requestEnvelope.request;
        
        const drinks = Alexa.getSlotValue(requestEnvelope, 'drink');
    
        const response = await drinkGet(deviceId, drinks);
        
        return handlerInput.responseBuilder
            .speak(`${response.data}` + " order again by saying order drink or just say no")
            .reprompt("Your drinks will be with you shortly")
            .getResponse(); 
       
    }
    
};

async function updateGet(deviceId, tableNumber, serverName) {
  return axios.post("http://18.206.56.17:4007/manageEcho", {
        "UID" : deviceId,
        "TableNumber" : tableNumber,
        "Bartender" : serverName
  });
}

const updateDeviceIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'updateDeviceIntent';
    },
    async handle(handlerInput) {
        const deviceId = handlerInput.requestEnvelope.context.System.device.deviceId;
        const {requestEnvelope, responseBuilder} = handlerInput;
        const {intent} = requestEnvelope.request;
        
        const serverName = Alexa.getSlotValue(requestEnvelope, 'serverName');
        const tableNumber = Alexa.getSlotValue(requestEnvelope, 'tableNumber');
        //const deviceName = Alexa.getSlotValue(requestEnvelope, 'deviceName');
        
        const response = await updateGet(deviceId, tableNumber, serverName);
        
        return handlerInput.responseBuilder
            .speak(`${response.data}`)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse(); 
       
    }
    
};

async function httpGet(deviceId) {
  return axios.post("http://18.206.56.17:4007/callService", {"UID": deviceId});
}

const fetchServerIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'fetchServerIntent';
    },
    async handle(handlerInput) {
        const deviceId = handlerInput.requestEnvelope.context.System.device.deviceId;
        const response = await httpGet(deviceId);
       
        return handlerInput.responseBuilder
            .speak(`${response.data}`)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse(); 
       
    }
    
};

const greetingMessageIntentHandler = {
        canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'greetingMessageIntent';
    },
    handle(handlerInput)
    {
        //const audioUrl = Util.getS3PreSignedUrl("Media/new-irish-greeting.mp3").replace(/&/g,'&amp;');
        //const audioUrl = Util.getS3PreSignedUrl("Media/new-italian-greeting.mp3").replace(/&/g,'&amp;');
        //const audioUrl = Util.getS3PreSignedUrl("Media/italian-greeting-withAd.mp3").replace(/&/g,'&amp;');
        const audioUrl = Util.getS3PreSignedUrl("Media/simpsonIntro.mp3").replace(/&/g,'&amp;');
        
        return handlerInput.responseBuilder
            .speak(`<audio src="${audioUrl}"/>`)
            .getResponse();
    }

}; 

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'You can say hello to me! How can I help?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
/* *
 * FallbackIntent triggers when a customer says something that doesn’t map to any intents in your skill
 * It must also be defined in the language model (if the locale supports it)
 * This handler can be safely added but will be ingnored in locales that do not support it yet 
 * */
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Sorry, I don\'t know about that. Please try again.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open 
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not 
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs 
 * */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse(); // notice we send an empty response
    }
};
/* *
 * The intent reflector is used for interaction model testing and debugging.
 * It will simply repeat the intent the user said. You can create custom handlers for your intents 
 * by defining them above, then also adding them to the request handler chain below 
 * */
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};
/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below 
 * */
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speakOutput = 'Sorry, I had trouble doing what you asked. Please try again.';
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

// This request interceptor will log all incoming requests to this lambda
const LoggingRequestInterceptor = {
    process(handlerInput) {
        console.log(`Incoming request: ${JSON.stringify(handlerInput.requestEnvelope)}`);
    }
};

// This response interceptor will log all outgoing responses of this lambda
const LoggingResponseInterceptor = {
    process(handlerInput, response) {
        console.log(`Outgoing response: ${JSON.stringify(response)}`);
    }
};

// This request interceptor will bind a translation function 't' to the handlerInput
const LocalisationRequestInterceptor = {
    process(handlerInput) {
        i18n.init({
            lng: Alexa.getLocale(handlerInput.requestEnvelope),
            resources: languageStrings
        }).then((t) => {
            handlerInput.t = (...args) => t(...args);
        });
    }
};

/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        readLinesHandler,
        feedbackIntentHandler,
        triviaIntentHandler,
        drinkOrderIntentHandler,
        updateDeviceIntentHandler,
        fetchServerIntentHandler,
        greetingMessageIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler)
    .addErrorHandlers(
        ErrorHandler)
    .addRequestInterceptors(
        LocalisationRequestInterceptor,
        LoggingRequestInterceptor)
    .addResponseInterceptors(
        LoggingResponseInterceptor)
    .withApiClient(new Alexa.DefaultApiClient())
    .withCustomUserAgent('sample/fetch-server/mod1')
    .lambda();