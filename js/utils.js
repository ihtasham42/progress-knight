function isDefined(variable) {
    return !isUndefined(variable);
}

function isUndefined(variable) {
    return typeof variable === 'undefined';
}

function isFunction(variable) {
    return typeof variable === 'function';
}

function isNumber(variable) {
    return typeof variable === 'number';
}

/**
 * @return whether or not the element was found and removed.
 */
function removeElement(array, element) {
    let indexOf = array.indexOf(element);
    if (indexOf < 0) {
        return false;
    }
    array.splice(indexOf, 1);
    return true;
}

/**
 * @param {string} msg
 */
function warnWithStacktrace(msg) {
    console.warn(msg);
    console.trace();
}


function randomInt(max) {
    return Math.floor(Math.random() * max);
}

function gaussianRandom(min = 0, max = 1, skew = 1) {
    const u = 1 - Math.random(); // Converting [0,1) to (0,1]
    const v = Math.random();
    let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    z = z / 10.0 + 0.5; // Translate to 0 -> 1
    if (z > 1 || z < 0) {
        z = gaussianRandom(min, max, skew); // resample between 0 and 1 if out of range}
    } else {
        z = Math.pow(z, skew); // Skew
        z *= max - min; // Stretch to fill range
        z += min; // offset to min
    }
    return z;
}

function gaussianRandomInt(min = 0, max = 1, skew = 1) {
    return Math.round(gaussianRandom(min, max, skew));
}
