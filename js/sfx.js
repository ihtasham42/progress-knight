let mousePos = {x: 0, y: 0};

/**
 * @param {String} html representing a single element
 * @return {Element}
 */
function htmlToElement(html) {
    let template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}

function randomInt(max) {
    return Math.floor(Math.random() * max);
}

function killAfter(element, timeout) {
    setTimeout(() => {
        element.remove();
    }, timeout);
}

function randomSize() {
    const factor = 4;
    let rnd = randomInt(1 + factor + factor * factor + factor * factor * factor);
    if (rnd < 1) {
        return 3;
    }

    if (rnd < 1 + factor) {
        return 2;
    }

    if (rnd < 1 + factor + factor * factor) {
        return 1;
    }

    return 0;
}

setInterval(() => {
    if (!gameData.paused) {
        document.querySelectorAll('.progressFill.current, #quickTaskDisplay .progressFill').forEach(function (element) {
            let particleElement = htmlToElement(`
<div style="position: absolute; transform: rotate(${randomInt(360)}deg); top: ${randomInt(30)}px; right: 0;">
    <div class="particle size${randomSize()}" style=""></div>
</div>`);
            killAfter(particleElement, 800);
            element.append(particleElement);
        });
    }

//     let particleElement = htmlToElement(`
// <div style="transform: rotate(${randomInt(360)}deg); top: ${mousePos.y}px; left: ${mousePos.x}px; position: absolute">
//     <div class="particle size${randomSize()}" style=""></div>
// </div>`);
//     killAfter(particleElement, 800);
//     document.body.append(particleElement);

}, 30);

window.addEventListener('mousemove', (event) => {
    mousePos = {x: event.clientX, y: event.clientY};
});
