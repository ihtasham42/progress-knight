'use strict';

class Task {
    constructor(baseData) {
        this.baseData = baseData;
        this.name = baseData.name;
        this.level = 0;
        this.maxLevel = 0;
        this.xp = 0;

        this.xpMultipliers = [];
    }

    getMaxXp() {
        return Math.round(this.baseData.maxXp * (this.level + 1) * Math.pow(1.01, this.level));
    }

    getXpLeft() {
        return Math.round(this.getMaxXp() - this.xp);
    }

    getMaxLevelMultiplier() {
        return 1 + this.maxLevel / 10;
    }

    getXpGain() {
        return applyMultipliers(10, this.xpMultipliers);
    }

    increaseXp() {
        this.xp += applySpeed(this.getXpGain());
        if (this.xp >= this.getMaxXp()) {
            this.levelUp();
        }
    }

    levelUp() {
        let excess = this.xp - this.getMaxXp();
        const previousLevel = this.level;
        while (excess >= 0) {
            this.level += 1;
            excess -= this.getMaxXp();
        }
        if (this.level > previousLevel) {
            Events.TaskLevelChanged.trigger({
                type: this.constructor.name,
                name: this.baseData.name,
                previousLevel: previousLevel,
                nextLevel: this.level,
            });
        }
        this.xp = this.getMaxXp() + excess;
    }
}

class Job extends Task {
    constructor(baseData) {
        super(baseData);
        this.incomeMultipliers = [];
    }

    getLevelMultiplier() {
        return 1 + Math.log10(this.level + 1);
    }

    getIncome() {
        return applyMultipliers(this.baseData.income, this.incomeMultipliers);
    }
}

class Skill extends Task {
    constructor(baseData) {
        super(baseData);
    }

    getEffect() {
        return 1 + this.baseData.effect * this.level;
    }

    getEffectDescription() {
        const description = this.baseData.description;
        return 'x' + this.getEffect().toFixed(2) + ' ' + description;
    }
}

class Item {
    constructor(baseData) {
        this.baseData = baseData;
        this.name = baseData.name;
        this.expenseMultipliers = [];
    }

    getEffect() {
        if (gameData.currentProperty !== this && !gameData.currentMisc.includes(this)) return 1;
        return this.baseData.effect;
    }

    getEffectDescription() {
        let description = this.baseData.description;
        if (itemCategories['Properties'].includes(this.name)) {
            description = 'Population';
        }
        return 'x' + this.baseData.effect.toFixed(1) + ' ' + description;
    }

    getExpense() {
        return applyMultipliers(this.baseData.expense, this.expenseMultipliers);
    }
}

class Requirement {
    constructor(type, elements, requirements) {
        this.type = type;
        this.elements = elements;
        this.requirements = requirements;
        this.completed = false;
    }

    isCompleted() {
        if (this.completed) return true;
        for (const requirement of this.requirements) {
            if (!this.getCondition(requirement)) {
                return false;
            }
        }
        this.completed = true;
        return true;
    }

    getCondition(requirement) {
        throw new TypeError('getCondition not implemented.');
    }
}

class TaskRequirement extends Requirement {
    constructor(elements, requirements) {
        super('task', elements, requirements);
    }

    getCondition(requirement) {
        return gameData.taskData[requirement.task].level >= requirement.requirement;
    }
}

class CoinRequirement extends Requirement {
    constructor(elements, requirements) {
        super('coins', elements, requirements);
    }

    getCondition(requirement) {
        return gameData.coins >= requirement.requirement;
    }
}

class AgeRequirement extends Requirement {
    constructor(elements, requirements) {
        super('age', elements, requirements);
    }

    getCondition(requirement) {
        return daysToYears(gameData.days) >= requirement.requirement;
    }
}

class EvilRequirement extends Requirement {
    constructor(elements, requirements) {
        super('evil', elements, requirements);
    }

    getCondition(requirement) {
        return gameData.evil >= requirement.requirement;
    }
}
