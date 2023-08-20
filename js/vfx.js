'use strict';

/**
 * @param {String} html representing a single element
 * @return {Element}
 */
function htmlToElement(html) {
    let template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    // noinspection JSValidateTypes
    return template.content.firstChild;
}

/**
 * Note: `visibility: hidden` is considered visible for this function as its still part of the dom & layout.
 *
 * @param {HTMLElement} element
 * @return {boolean}
 * @
 */
function isVisible(element) {
    // Glorious stolen jQuery logic
    return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
}

/**
 * Note: `visibility: hidden` is considered visible for this function as its still part of the dom & layout.
 *
 * @param {HTMLElement} element
 * @return {boolean}
 */
function isHidden(element) {
    return !isVisible(element);
}

/**
 *
 * @param {Element} element
 * @param {number} timeout milliseconds until to remove the element from DOM
 */
function killAfter(element, timeout) {
    setTimeout(() => {
        element.remove();
    }, timeout);
}

/**
 * @param {Element} element
 * @param {number} animationCount how many animations need to end before the element is removed?
 */
function killAfterAnimation(element, animationCount = 1) {
    // Little construct to capture `animationsEnded` per instance
    (function (animationsEnded) {
        element.addEventListener('animationend', function () {
            animationsEnded++;
            if (animationsEnded >= animationCount) {
                element.remove();
            }
        });
    })(0);
}

function randomSize(factor = 4) {
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

const VFX = {};

VFX.flash = function (element, baseColor) {
    let flashElement = htmlToElement(`<div class="flash" style="color: ${baseColor}"></div>`);
    killAfterAnimation(flashElement);
    element.append(flashElement);
};

const ParticleSystem = {
    followMouseInterval: undefined
};

ParticleSystem.followMouse = function (enabled = true) {
    if (!enabled) {
        clearInterval(ParticleSystem.followMouseInterval);
        ParticleSystem.followMouseInterval = undefined;
        return;
    }

    ParticleSystem.mousePos = {x: 0, y: 0};

    window.addEventListener('mousemove', function (event) {
        ParticleSystem.mousePos = {x: event.clientX, y: event.clientY};
    });

    window.addEventListener('click', function (event) {
        onetimeSplash(document.body, 60, function () {
            return window.innerWidth - event.clientX;
        }, function () {
            return event.clientY;
        });
    });

    ParticleSystem.followMouseInterval = setInterval(function () {
        let mousePos = ParticleSystem.mousePos;
        let particleElement = htmlToElement(`
<div style="transform: rotate(${randomInt(360)}deg); top: ${mousePos.y}px; left: ${mousePos.x}px; position: absolute">
    <div class="particle size${randomSize()}" style=""></div>
</div>`);
        killAfterAnimation(particleElement);
        document.body.append(particleElement);
    }, 20);
};

ParticleSystem.followProgressBars = function (enabled = true) {
    if (!enabled) {
        clearInterval(ParticleSystem.followProgressBarsInterval);
        return;
    }

    ParticleSystem.followProgressBarsInterval = setInterval(() => {
        if (gameData.paused || !isAlive()) {
            return;
        }

        document.querySelectorAll('.progressFill.current').forEach(function (element) {
            // Don't spawn particles on elements that are invisible
            if (isHidden(element)) return;

            // TODO higher progress speed = more particles
            let particleElement = htmlToElement(`
<div style="position: absolute; transform: rotate(${randomInt(360)}deg); top: ${randomInt(element.clientHeight)}px; right: 0;">
<div class="particle size${randomSize()}" style=""></div>
</div>`);
            killAfterAnimation(particleElement);
            element.append(particleElement);
        });
    }, 30);
};

function onetimeSplash(element, numberOfParticles, fnX, fnY) {
    for (let i = 0; i < numberOfParticles; i++) {
        let particleElement = htmlToElement(`
<div style="position: absolute; transform: rotate(${-60 + randomInt(120)}deg); top: ${fnY()}px; right: ${fnX()}px; animation: fade-out 600ms ease-in-out;">
<div class="particle size${randomSize(3)}" style="animation-duration: 600ms, 600ms; opacity: 0.6; scale: 0.5"></div>
</div>`);
        killAfterAnimation(particleElement);
        element.append(particleElement);
    }
}

ParticleSystem.onetimeSplash = function (element, numberOfParticles) {
    if (!element) return;
    let height = element.clientHeight;
    onetimeSplash(
        element,
        numberOfParticles,
        function () {
            return 0;
        },
        function () {
            return gaussianRandomInt(0, height);
        });
};


// ParticleSystem.followMouse(true);
ParticleSystem.followProgressBars(true);

Events.TaskLevelChanged.subscribe(function (taskInfo) {
    // Only show animations if the level went up
    if (taskInfo.previousLevel >= taskInfo.nextLevel) return;

    let numberOfParticles = 10;
    let taskProgressBar = getTaskElement(taskInfo.name)?.querySelector('.progressBar');
    if (taskProgressBar != null && isVisible(taskProgressBar)) {
        // Don't spawn particles on elements that are invisible
        ParticleSystem.onetimeSplash(taskProgressBar, numberOfParticles);
        VFX.flash(taskProgressBar);
    }
    let quickTaskProgressBar = document.querySelector(`#quickTaskDisplay .${taskInfo.type}.progressBar`);
    if (!quickTaskProgressBar) return;
    ParticleSystem.onetimeSplash(quickTaskProgressBar, numberOfParticles);
    VFX.flash(quickTaskProgressBar);
});

// TODO particle anpassungen ausprobieren
//      - round particles
//      - particles mostly in 4 directions (diagonally) instead of all directions
//      - particles outside instead of inside
//      - particle opacity variety instead of size variety
//      - move particles the same range but have them spawn further away
// TODO flash into overlay on progress finish
// TODO bump numbers on increase
