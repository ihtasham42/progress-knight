// The game state: one object that the game steps change and saves record.

export const gameData = {
    taskData: {},
    itemData: {},

    coins: 0,
    days: 365 * 14,
    evil: 0,
    paused: false,
    timeWarpingEnabled: true,

    rebirthOneCount: 0,
    rebirthTwoCount: 0,

    currentJob: null,
    currentSkill: null,
    currentProperty: null,
    currentMisc: null,

    // Saved since save version 4
    automation: {
        autoPromote: false,
        autoLearn: false,
        skippedSkills: new Set(), // skill ids
    },
}
