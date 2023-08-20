class LayerData {
    constructor(color) {
        this.color = color;
    }
}

class LayeredTask extends Task {
    constructor(baseData, maxLayers, progressBarId) {
        super(baseData);
        this.maxLayers = maxLayers;
        this.done = false;
        this.taskProgressBar = document.getElementById('battleProgressBar');
        this.taskProgressBarFill = this.taskProgressBar.getElementsByClassName('progressFill')[0];
        this.adjustLayerColorsByLevel();
    }

    levelUp() {
        super.levelUp();
        this.adjustLayerColorsByLevel();
    }

    adjustLayerColorsByLevel() {
        if (this.level >= this.maxLayers) {
            this.onDone();
            return;
        }

        this.taskProgressBarFill.style.backgroundColor = layerData[this.level].color;

        let newBackgroundColor;
        if (this.level < this.maxLayers - 1 && this.level < layerCount - 1) {
            newBackgroundColor = layerData[this.level + 1].color;
        } else {
            newBackgroundColor = lastLayerData.color;
        }
        this.taskProgressBar.style.backgroundColor = newBackgroundColor;
    }

    onDone() {
        this.done = true;
    }
}

class Battle extends LayeredTask {
    constructor(baseData, maxLayers, progressBarId) {
        super(baseData, maxLayers, progressBarId);
    }

    onDone() {
        super.onDone();
        Events.GameOver.trigger({
            bossDefeated: this.done,
        });
    }
}