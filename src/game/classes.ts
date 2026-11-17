import { itemCategories } from "./data.ts"
import { gameData } from "./state.ts"
import { getBaseLog, applyMultipliers, applySpeed, daysToYears } from "./rules.ts"
import type { JobDefinition, SkillDefinition, ItemDefinition } from "./types.ts"

// Fields are declared, not initialised here, so the objects are built
// exactly as before: by the constructors, in the same order.

export class Task {
    declare baseData: JobDefinition | SkillDefinition
    declare name: string
    declare level: number
    declare maxLevel: number
    declare xp: number
    declare xpMultipliers: (() => number)[]

    constructor(baseData: JobDefinition | SkillDefinition) {
        this.baseData = baseData
        this.name = baseData.name
        this.level = 0
        this.maxLevel = 0 
        this.xp = 0

        this.xpMultipliers = [
        ]
    }

    getMaxXp(): number {
        const maxXp = Math.round(this.baseData.maxXp * (this.level + 1) * Math.pow(1.01, this.level))
        return maxXp
    }

    getXpLeft(): number {
        return Math.round(this.getMaxXp() - this.xp)
    }

    getMaxLevelMultiplier(): number {
        const maxLevelMultiplier = 1 + this.maxLevel / 10
        return maxLevelMultiplier
    }

    getXpGain(): number {
        return applyMultipliers(10, this.xpMultipliers)
    }

    increaseXp(): void {
        this.xp += applySpeed(this.getXpGain())
        if (this.xp >= this.getMaxXp()) {
            let excess = this.xp - this.getMaxXp()
            while (excess >= 0) {
                this.level += 1
                excess -= this.getMaxXp()
            }
            this.xp = this.getMaxXp() + excess
        }
    }
}

export class Job extends Task {
    declare baseData: JobDefinition
    declare incomeMultipliers: (() => number)[]

    constructor(baseData: JobDefinition) {
        super(baseData)   
        this.incomeMultipliers = [
        ]
    }

    getLevelMultiplier(): number {
        const levelMultiplier = 1 + Math.log10(this.level + 1)
        return levelMultiplier
    }
    
    getIncome(): number {
        return applyMultipliers(this.baseData.income, this.incomeMultipliers) 
    }
}

export class Skill extends Task {
    declare baseData: SkillDefinition

    constructor(baseData: SkillDefinition) {
        super(baseData)
    }

    getEffect(): number {
        const curve = this.baseData.effectCurve
        if (curve && curve.type == "log") {
            return 1 + getBaseLog(curve.base, this.level + 1)
        }
        if (curve && curve.type == "logReduction") {
            const multiplier = 1 - getBaseLog(curve.base, this.level + 1) / curve.divisor
            return multiplier < curve.minimum ? curve.minimum : multiplier
        }
        return 1 + this.baseData.effect * this.level
    }

    getEffectDescription(): string {
        const description = this.baseData.description
        const text = "x" + String(this.getEffect().toFixed(2)) + " " + description
        return text
    }
}

export class Item {
    declare baseData: ItemDefinition
    declare name: string
    declare expenseMultipliers: (() => number)[]

    constructor(baseData: ItemDefinition) {  
        this.baseData = baseData
        this.name = baseData.name
        this.expenseMultipliers = [
         
        ]
    }

    getEffect(): number {
        if (gameData.currentProperty != this && !gameData.currentMisc.includes(this)) return 1
        const effect = this.baseData.effect
        return effect
    }

    getEffectDescription(): string {
        let description = this.baseData.description
        if (itemCategories["Properties"].includes(this.name)) description = "Happiness"
        const text = "x" + this.baseData.effect.toFixed(1) + " " + description
        return text
    }

    getExpense(): number {
        return applyMultipliers(this.baseData.expense, this.expenseMultipliers)
    }
}

// A requirement's conditions, as built by createRequirement() in engine.ts.
// Task conditions name the task; all of them have the level or amount.
export interface Condition {
    requirement: number
}
export interface TaskCondition extends Condition {
    task: string // name
}

export abstract class Requirement<C extends Condition = Condition> {
    declare requirements: C[]
    declare completed: boolean
    declare type: "task" | "coins" | "age" | "evil"

    constructor(requirements: C[]) {
        this.requirements = requirements
        this.completed = false
    }

    abstract getCondition(requirement: C): boolean

    isCompleted(): boolean {
        if (this.completed) {return true}
        for (const requirement of this.requirements) {
            if (!this.getCondition(requirement)) {
                return false
            }
        }
        this.completed = true
        return true
    }
}

export class TaskRequirement extends Requirement<TaskCondition> {
    constructor(requirements: TaskCondition[]) {
        super(requirements)
        this.type = "task"
    }

    getCondition(requirement: TaskCondition): boolean {
        return gameData.taskData[requirement.task].level >= requirement.requirement
    }
}

export class CoinRequirement extends Requirement {
    constructor(requirements: Condition[]) {
        super(requirements)
        this.type = "coins"
    }

    getCondition(requirement: Condition): boolean {
        return gameData.coins >= requirement.requirement
    }
}

export class AgeRequirement extends Requirement {
    constructor(requirements: Condition[]) {
        super(requirements)
        this.type = "age"
    }

    getCondition(requirement: Condition): boolean {
        return daysToYears(gameData.days) >= requirement.requirement
    }
}

export class EvilRequirement extends Requirement {
    constructor(requirements: Condition[]) {
        super(requirements)
        this.type = "evil"
    }

    getCondition(requirement: Condition): boolean {
        return gameData.evil >= requirement.requirement
    }
}
