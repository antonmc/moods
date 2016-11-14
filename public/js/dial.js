// Tone types
// Add type here if another one becomes available
var TONE_TYPES = {
    emotion: {
        text: 'Emotion',
        position: 'left',
        traits: ['anger', 'disgust', 'fear', 'joy', 'sadness']
    },
    writing: {
        text: 'Writing',
        position: 'middle',
        traits: ['analytical', 'confident', 'tentative']
    },
    social: {
        text: 'Social',
        position: 'right',
        traits: ['openness_big5', 'conscientiousness_big5', 'extraversion_big5', 'agreeableness_big5', 'neuroticism_big5']
    }
}

// Tone Level Constants
var TONE_LEVELS = {
    document: {
        text: 'Document'
    },
    sentence: {
        text: 'Sentence'
    }
};

var canvas;
var context;
var mouseIsDown;

var SELECTED_INDEX = 0

var SELECTIONS = ['EMOTION', 'WRITING', 'SOCIAL'];

var SELECTED = SELECTIONS[SELECTED_INDEX];

var startX;

function mouseUp() {
    mouseIsDown = 0;
    mouseXY();
}

function touchUp() {
    mouseIsDown = 0;
    // no touch to track, so just show state
    showPos();
}

function mouseDown(e) {
    mouseIsDown = 1;
    if (!e)
        var e = event;
    canX = e.pageX - canvas.offsetLeft;
    canY = e.pageY - canvas.offsetTop;

    startX = canX;

    if (canY < canvas.height / 2) {

        if (canX > 25 && canX < 65) {
            SELECTED = SELECTIONS[0];
        }

        if (canX > 65 && canX < 115) {
            SELECTED = SELECTIONS[1];
        }

        if (canX > 115 && canX < 160) {
            SELECTED = SELECTIONS[2];
        }
    }

    addDial(tonechart);

    console.log('mouse down');

    mouseXY();
}

function touchDown() {
    mouseIsDown = 1;
    touchXY();
}

function mouseXY(e) {
    if (!e)
        var e = event;
    canX = e.pageX - canvas.offsetLeft;
    canY = e.pageY - canvas.offsetTop;
    showPos();
}

function touchXY(e) {
    if (!e)
        var e = event;
    e.preventDefault();
    canX = e.targetTouches[0].pageX - can.offsetLeft;
    canY = e.targetTouches[0].pageY - can.offsetTop;
    showPos();
}

function showPos() {
    var str = canX + ", " + canY;
    if (mouseIsDown)
        str += " down";
    if (!mouseIsDown)
        str += " up";
}

function showEmotion(centerX, centerY) {

    /* FAR LEFT */

    var sx = centerX - 20;
    var sy = centerY - 22;
    var sxend = centerX - 40;
    var syend = centerY - 44;

    var position = {
        sx: sx,
        sy: sy,
        sxend: sxend,
        syend: syend
    };

    return position;
}


function showWriting(centerX, centerY) {

    /* MIDDLE */

    var sx = centerX;
    var sy = centerY - 30;
    var sxend = centerX;
    var syend = centerY - 60;

    var position = {
        sx: sx,
        sy: sy,
        sxend: sxend,
        syend: syend
    };

    return position;
}

function showSocial(centerX, centerY) {

    /* FAR RIGHT */

    var sx = centerX + 20;
    var sy = centerY - 22;
    var sxend = centerX + 40;
    var syend = centerY - 44;

    var position = {
        sx: sx,
        sy: sy,
        sxend: sxend,
        syend: syend
    };

    return position;
}

var tonechart;

function addDial(chart) {

    tonechart = chart;

    canvas = document.getElementById('knob');
    context = canvas.getContext('2d');
    var centerX = canvas.width / 2;
    var centerY = canvas.height / 2;
    var radius = 70;

    context.beginPath();
    context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    context.fillStyle = '#FFFCF4';
    context.fill();
    context.lineWidth = 5;
    context.strokeStyle = '#EDEADE';
    context.stroke();

    context.beginPath();
    context.strokeStyle = '#FD7D50'; // #f6a893';
    context.lineWidth = 6;

    var position;

    switch (SELECTED) {
    case "EMOTION":
        position = showEmotion(centerX, centerY);
        tonechart.toggleType("emotion");
        break;

    case "WRITING":
        position = showWriting(centerX, centerY);
        tonechart.toggleType("language");
        break;

    case "SOCIAL":
        position = showSocial(centerX, centerY);
        tonechart.toggleType("social");

        break;
    }

    context.moveTo(position.sx, position.sy);
    context.lineTo(position.sxend, position.syend);
    context.stroke();

    var mouseIsDown = false;

    canvas.addEventListener("mousedown", mouseDown, false);
    canvas.addEventListener("mousemove", mouseXY, false);
    canvas.addEventListener("touchstart", touchDown, false);
    canvas.addEventListener("touchmove", touchXY, true);
    canvas.addEventListener("touchend", touchUp, false);
}