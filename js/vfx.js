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

const ParticleSystem = {
};

ParticleSystem.followMouse = function (enabled = true) {
    if (!enabled) {
        clearInterval(ParticleSystem.followMouseInterval);
        return;
    }

    ParticleSystem.mousePos = {x: 0, y: 0};

    window.addEventListener('mousemove', (event) => {
        ParticleSystem.mousePos = {x: event.clientX, y: event.clientY};
    });

    ParticleSystem.followMouseInterval = setInterval(function () {
        let mousePos = ParticleSystem.mousePos;
        let particleElement = htmlToElement(`
<div style="transform: rotate(${randomInt(360)}deg); top: ${mousePos.y}px; left: ${mousePos.x}px; position: absolute">
    <div class="particle size${randomSize()}" style=""></div>
</div>`);
        killAfter(particleElement, 800);
        document.body.append(particleElement);
    }, 20);
}

ParticleSystem.followProgressBars = function (enabled = true) {
    if (!enabled) {
        clearInterval(ParticleSystem.followProgressBarsInterval);
        return;
    }

    ParticleSystem.followProgressBarsInterval = setInterval(() => {
        if (gameData.paused) {
            return;
        }

        document.querySelectorAll('.progressFill.current, #quickTaskDisplay .progressFill').forEach(function (element) {
            // TODO read element height
            let particleElement = htmlToElement(`
<div style="position: absolute; transform: rotate(${randomInt(360)}deg); top: ${randomInt(30)}px; right: 0;">
<div class="particle size${randomSize()}" style=""></div>
</div>`);
            killAfter(particleElement, 800);
            element.append(particleElement);
        });
    }, 30);
}

ParticleSystem.onetimeSplash = function (element, numberOfParticles) {
    for (let i = 0; i < numberOfParticles; i++) {
        // TODO read element height
        let particleElement = htmlToElement(`
<div style="position: absolute; transform: rotate(${randomInt(360)}deg); top: ${gaussianRandomInt(0, 30)}px; right: 0;">
<div class="particle size${randomSize()}" style=""></div>
</div>`);
        killAfter(particleElement, 800);
        element.append(particleElement);
    }
}


// ParticleSystem.followMouse(true);
ParticleSystem.followProgressBars(true);

Events.TaskLevelChanged.subscribe(function (taskInfo) {
    ParticleSystem.onetimeSplash(getTaskElement(taskInfo.name).querySelector('.progressBar'), 200);
    ParticleSystem.onetimeSplash(document.querySelector(`#quickTaskDisplay .${taskInfo.type}.progressBar`), 200);
});

// TODO flash into overlay on progress finish
// TODO bump numbers on increase
