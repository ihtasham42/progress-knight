"use strict"

// Static game data. Each job, skill and item is defined once, with a stable
// id that saves can refer to even if its display name changes.
//
// requires: what must be reached before it is shown and can be used. Task
//   requirements refer to other jobs/skills by id.
// effectCurve (skills, optional): replaces the default effect of
//   1 + effect * level.
//   {type: "log", base}: 1 + log_base(level + 1)
//   {type: "logReduction", base, divisor, minimum}:
//     1 - log_base(level + 1) / divisor, but never below minimum
// boosts: what a skill or item multiplies by its effect. (A property's effect
//   is always happiness, so properties don't list boosts.)
//   stat: "xp", "income", "expense", "happiness", "lifespan", "gameSpeed"
//     or "evilGain"
//   of: which tasks or items it applies to (xp, income and expense only):
//     "all", "jobs", "skills", "items", a category name, or a task id
//
// The older lookup tables the rest of the game uses (jobBaseData,
// jobCategories, tooltips, ...) are derived from these definitions.

function definitionsByName(definitions) {
    const byName = {}
    for (const definition of definitions) byName[definition.name] = definition
    return byName
}

// Category name -> entity names, in definition order
function namesByCategory(definitions) {
    const categories = {}
    for (const definition of definitions) {
        if (!categories[definition.category]) categories[definition.category] = []
        categories[definition.category].push(definition.name)
    }
    return categories
}

const jobs = [
    // Common work
    {id: "beggar", name: "Beggar", category: "Common work", maxXp: 50, income: 5, requires: [],
        tooltip: "Struggle day and night for a couple of copper coins. It feels like you are at the brink of death each day."},
    {id: "farmer", name: "Farmer", category: "Common work", maxXp: 100, income: 9, requires: [{task: "beggar", level: 10}],
        tooltip: "Plow the fields and grow the crops. It's not much but it's honest work."},
    {id: "fisherman", name: "Fisherman", category: "Common work", maxXp: 200, income: 15, requires: [{task: "farmer", level: 10}],
        tooltip: "Reel in various fish and sell them for a handful of coins. A relaxing but still a poor paying job."},
    {id: "miner", name: "Miner", category: "Common work", maxXp: 400, income: 40, requires: [{task: "strength", level: 10}, {task: "fisherman", level: 10}],
        tooltip: "Delve into dangerous caverns and mine valuable ores. The pay is quite meager compared to the risk involved."},
    {id: "blacksmith", name: "Blacksmith", category: "Common work", maxXp: 800, income: 80, requires: [{task: "strength", level: 30}, {task: "miner", level: 10}],
        tooltip: "Smelt ores and carefully forge weapons for the military. A respectable and OK paying commoner job."},
    {id: "merchant", name: "Merchant", category: "Common work", maxXp: 1600, income: 150, requires: [{task: "bargaining", level: 50}, {task: "blacksmith", level: 10}],
        tooltip: "Travel from town to town, bartering fine goods. The job pays decently well and is a lot less manually-intensive."},

    // Military
    {id: "squire", name: "Squire", category: "Military", maxXp: 100, income: 5, requires: [{task: "strength", level: 5}],
        tooltip: "Carry around your knight's shield and sword along the battlefield. Very meager pay but the work experience is quite valuable."},
    {id: "footman", name: "Footman", category: "Military", maxXp: 1000, income: 50, requires: [{task: "strength", level: 20}, {task: "squire", level: 10}],
        tooltip: "Put down your life to battle with enemy soldiers. A courageous, respectable job but you are still worthless in the grand scheme of things."},
    {id: "veteran_footman", name: "Veteran footman", category: "Military", maxXp: 10000, income: 120, requires: [{task: "battle_tactics", level: 40}, {task: "footman", level: 10}],
        tooltip: "More experienced and useful than the average footman, take out the enemy forces in battle with your might. The pay is not that bad."},
    {id: "knight", name: "Knight", category: "Military", maxXp: 100000, income: 300, requires: [{task: "strength", level: 100}, {task: "veteran_footman", level: 10}],
        tooltip: "Slash and pierce through enemy soldiers with ease, while covered in steel from head to toe. A decently paying and very respectable job."},
    {id: "veteran_knight", name: "Veteran knight", category: "Military", maxXp: 1000000, income: 1000, requires: [{task: "battle_tactics", level: 150}, {task: "knight", level: 10}],
        tooltip: "Utilising your unmatched combat ability, slaughter enemies effortlessly. Most footmen in the military would never be able to acquire such a well paying job like this."},
    {id: "elite_knight", name: "Elite knight", category: "Military", maxXp: 7500000, income: 3000, requires: [{task: "strength", level: 300}, {task: "veteran_knight", level: 10}],
        tooltip: "Obliterate squadrons of enemy soldiers in one go with extraordinary proficiency, while equipped with the finest gear. Such a feared unit on the battlefield is paid extremely well."},
    {id: "holy_knight", name: "Holy knight", category: "Military", maxXp: 40000000, income: 15000, requires: [{task: "mana_control", level: 500}, {task: "elite_knight", level: 10}],
        tooltip: "Collapse entire armies in mere seconds with your magically imbued blade. The handful of elite knights who attain this level of power are showered with coins."},
    {id: "legendary_knight", name: "Legendary knight", category: "Military", maxXp: 150000000, income: 50000, requires: [{task: "mana_control", level: 1000}, {task: "battle_tactics", level: 1000}, {task: "holy_knight", level: 10}],
        tooltip: "Feared worldwide, obliterate entire nations in a blink of an eye. Roughly every century, only one holy knight is worthy of receiving such an esteemed title."},

    // The Arcane Association
    {id: "student", name: "Student", category: "The Arcane Association", maxXp: 100000, income: 100, requires: [{task: "concentration", level: 200}, {task: "meditation", level: 200}],
        tooltip: "Study the theory of mana and practice basic spells. There is minor pay to cover living costs, however, this is a necessary stage in becoming a mage."},
    {id: "apprentice_mage", name: "Apprentice mage", category: "The Arcane Association", maxXp: 1000000, income: 1000, requires: [{task: "mana_control", level: 400}, {task: "student", level: 10}],
        tooltip: "Under the supervision of a mage, perform basic spells against enemies in battle. Generous pay will be provided to cover living costs."},
    {id: "mage", name: "Mage", category: "The Arcane Association", maxXp: 10000000, income: 7500, requires: [{task: "mana_control", level: 700}, {task: "apprentice_mage", level: 10}],
        tooltip: "Turn the tides of battle through casting intermediate spells and mentor other apprentices. The pay for this particular job is extremely high."},
    {id: "wizard", name: "Wizard", category: "The Arcane Association", maxXp: 100000000, income: 50000, requires: [{task: "mana_control", level: 1000}, {task: "mage", level: 10}],
        tooltip: "Utilise advanced spells to ravage and destroy entire legions of enemy soldiers. Only a small percentage of mages deserve to attain this role and are rewarded with an insanely high pay."},
    {id: "master_wizard", name: "Master wizard", category: "The Arcane Association", maxXp: 10000000000, income: 250000, requires: [{task: "mana_control", level: 1500}, {task: "wizard", level: 10}],
        tooltip: "Blessed with unparalleled talent, perform unbelievable feats with magic at will. It is said that a master wizard has enough destructive power to wipe an empire off the map."},
    {id: "chairman", name: "Chairman", category: "The Arcane Association", maxXp: 1000000000000, income: 1000000, requires: [{task: "mana_control", level: 2000}, {task: "master_wizard", level: 10}],
        tooltip: "Spend your days administrating The Arcane Association and investigate the concepts of true immortality. The chairman receives ludicrous amounts of pay daily."},
]

const skills = [
    // Fundamentals
    {id: "concentration", name: "Concentration", category: "Fundamentals", maxXp: 100, effect: 0.01, description: "Skill xp", boosts: [{stat: "xp", of: "skills"}], requires: [],
        tooltip: "Improve your learning speed through practising intense concentration activities."},
    {id: "productivity", name: "Productivity", category: "Fundamentals", maxXp: 100, effect: 0.01, description: "Job xp", boosts: [{stat: "xp", of: "jobs"}], requires: [{task: "concentration", level: 5}],
        tooltip: "Learn to procrastinate less at work and receive more job experience per day."},
    {id: "bargaining", name: "Bargaining", category: "Fundamentals", maxXp: 100, effect: -0.01, description: "Expenses", effectCurve: {type: "logReduction", base: 7, divisor: 10, minimum: 0.1}, boosts: [{stat: "expense", of: "items"}], requires: [{task: "concentration", level: 20}],
        tooltip: "Study the tricks of the trade and persuasive skills to lower any type of expense."},
    {id: "meditation", name: "Meditation", category: "Fundamentals", maxXp: 100, effect: 0.01, description: "Happiness", boosts: [{stat: "happiness"}], requires: [{task: "concentration", level: 30}, {task: "productivity", level: 20}],
        tooltip: "Fill your mind with peace and tranquility to tap into greater happiness from within."},

    // Combat
    {id: "strength", name: "Strength", category: "Combat", maxXp: 100, effect: 0.01, description: "Military pay", boosts: [{stat: "income", of: "Military"}], requires: [],
        tooltip: "Condition your body and strength through harsh training. Stronger individuals are paid more in the military."},
    {id: "battle_tactics", name: "Battle tactics", category: "Combat", maxXp: 100, effect: 0.01, description: "Military xp", boosts: [{stat: "xp", of: "Military"}], requires: [{task: "concentration", level: 20}],
        tooltip: "Create and revise battle strategies, improving experience gained in the military."},
    {id: "muscle_memory", name: "Muscle memory", category: "Combat", maxXp: 100, effect: 0.01, description: "Strength xp", boosts: [{stat: "xp", of: "strength"}], requires: [{task: "concentration", level: 30}, {task: "strength", level: 30}],
        tooltip: "Strengthen your neurons through habit and repetition, improving strength gains throughout the body."},

    // Magic
    {id: "mana_control", name: "Mana control", category: "Magic", maxXp: 100, effect: 0.01, description: "T.A.A. xp", boosts: [{stat: "xp", of: "The Arcane Association"}], requires: [{task: "concentration", level: 200}, {task: "meditation", level: 200}],
        tooltip: "Strengthen your mana channels throughout your body, aiding you in becoming a more powerful magical user."},
    {id: "immortality", name: "Immortality", category: "Magic", maxXp: 100, effect: 0.01, description: "Longer lifespan", effectCurve: {type: "log", base: 33}, boosts: [{stat: "lifespan"}], requires: [{task: "apprentice_mage", level: 10}],
        tooltip: "Lengthen your lifespan through the means of magic. However, is this truly the immortality you have tried seeking for...?"},
    {id: "time_warping", name: "Time warping", category: "Magic", maxXp: 100, effect: 0.01, description: "Gamespeed", effectCurve: {type: "log", base: 13}, boosts: [{stat: "gameSpeed"}], requires: [{task: "mage", level: 10}],
        tooltip: "Bend space and time through forbidden techniques, resulting in a faster gamespeed."},
    {id: "super_immortality", name: "Super immortality", category: "Magic", maxXp: 100, effect: 0.01, description: "Longer lifespan", boosts: [{stat: "lifespan"}], requires: [{task: "chairman", level: 1000}],
        tooltip: "Through harnessing ancient, forbidden techniques, lengthen your lifespan drastically beyond comprehension."},

    // Dark magic
    {id: "dark_influence", name: "Dark influence", category: "Dark magic", maxXp: 100, effect: 0.01, description: "All xp", boosts: [{stat: "xp", of: "all"}], requires: [{evil: 1}],
        tooltip: "Encompass yourself with formidable power bestowed upon you by evil, allowing you to pick up and absorb any job or skill with ease."},
    {id: "evil_control", name: "Evil control", category: "Dark magic", maxXp: 100, effect: 0.01, description: "Evil gain", boosts: [{stat: "evilGain"}], requires: [{evil: 1}],
        tooltip: "Tame the raging and growing evil within you, improving evil gain in-between rebirths."},
    {id: "intimidation", name: "Intimidation", category: "Dark magic", maxXp: 100, effect: -0.01, description: "Expenses", effectCurve: {type: "logReduction", base: 7, divisor: 10, minimum: 0.1}, boosts: [{stat: "expense", of: "items"}], requires: [{evil: 1}],
        tooltip: "Learn to emit a devilish aura which strikes extreme fear into other merchants, forcing them to give you heavy discounts."},
    {id: "demon_training", name: "Demon training", category: "Dark magic", maxXp: 100, effect: 0.01, description: "All xp", boosts: [{stat: "xp", of: "all"}], requires: [{evil: 25}],
        tooltip: "A mere human body is too feeble and weak to withstand evil. Train with forbidden methods to slowly manifest into a demon, capable of absorbing knowledge rapidly."},
    {id: "blood_meditation", name: "Blood meditation", category: "Dark magic", maxXp: 100, effect: 0.01, description: "Evil gain", boosts: [{stat: "evilGain"}], requires: [{evil: 75}],
        tooltip: "Grow and culture the evil within you through the sacrifice of other living beings, drastically increasing evil gain."},
    {id: "demons_wealth", name: "Demon's wealth", category: "Dark magic", maxXp: 100, effect: 0.002, description: "Job pay", boosts: [{stat: "income", of: "jobs"}], requires: [{evil: 500}],
        tooltip: "Through the means of dark magic, multiply the raw matter of the coins you receive from your job."},
]

const items = [
    // Properties
    {id: "homeless", name: "Homeless", category: "Properties", expense: 0, effect: 1, requires: [{coins: 0}],
        tooltip: "Sleep on the uncomfortable, filthy streets while almost freezing to death every night. It cannot get any worse than this."},
    {id: "tent", name: "Tent", category: "Properties", expense: 15, effect: 1.4, requires: [{coins: 0}],
        tooltip: "A thin sheet of tattered cloth held up by a couple of feeble, wooden sticks. Horrible living conditions but at least you have a roof over your head."},
    {id: "wooden_hut", name: "Wooden hut", category: "Properties", expense: 100, effect: 2, requires: [{coins: 10000}],
        tooltip: "Shabby logs and dirty hay glued together with horse manure. Much more sturdy than a tent, however, the stench isn't very pleasant."},
    {id: "cottage", name: "Cottage", category: "Properties", expense: 750, effect: 3.5, requires: [{coins: 75000}],
        tooltip: "Structured with a timber frame and a thatched roof. Provides decent living conditions for a fair price."},
    {id: "house", name: "House", category: "Properties", expense: 3000, effect: 6, requires: [{coins: 300000}],
        tooltip: "A building formed from stone bricks and sturdy timber, which contains a few rooms. Although quite expensive, it is a comfortable abode."},
    {id: "large_house", name: "Large house", category: "Properties", expense: 25000, effect: 12, requires: [{coins: 2500000}],
        tooltip: "Much larger than a regular house, which boasts even more rooms and multiple floors. The building is quite spacious but comes with a hefty price tag."},
    {id: "small_palace", name: "Small palace", category: "Properties", expense: 300000, effect: 25, requires: [{coins: 30000000}],
        tooltip: "A very rich and meticulously built structure rimmed with fine metals such as silver. Extremely high expenses to maintain for a lavish lifestyle."},
    {id: "grand_palace", name: "Grand palace", category: "Properties", expense: 5000000, effect: 60, requires: [{coins: 500000000}],
        tooltip: "A grand residence completely composed of gold and silver. Provides the utmost luxurious and comfortable living conditions possible for a ludicrous price."},

    // Misc
    {id: "book", name: "Book", category: "Misc", expense: 10, effect: 1.5, description: "Skill xp", boosts: [{stat: "xp", of: "skills"}], requires: [{coins: 0}],
        tooltip: "A place to write down all your thoughts and discoveries, allowing you to learn a lot more quickly."},
    {id: "dumbbells", name: "Dumbbells", category: "Misc", expense: 50, effect: 1.5, description: "Strength xp", boosts: [{stat: "xp", of: "strength"}], requires: [{coins: 5000}],
        tooltip: "Heavy tools used in strenuous exercise to toughen up and accumulate strength even faster than before. "},
    {id: "personal_squire", name: "Personal squire", category: "Misc", expense: 200, effect: 2, description: "Job xp", boosts: [{stat: "xp", of: "jobs"}], requires: [{coins: 20000}],
        tooltip: "Assists you in completing day to day activities, giving you more time to be productive at work."},
    {id: "steel_longsword", name: "Steel longsword", category: "Misc", expense: 1000, effect: 2, description: "Military xp", boosts: [{stat: "xp", of: "Military"}], requires: [{coins: 100000}],
        tooltip: "A fine blade used to slay enemies even quicker in combat and therefore gain more experience."},
    {id: "butler", name: "Butler", category: "Misc", expense: 7500, effect: 1.5, description: "Happiness", boosts: [{stat: "happiness"}], requires: [{coins: 750000}],
        tooltip: "Keeps your household clean at all times and also prepares three delicious meals per day, leaving you in a happier, stress-free mood."},
    {id: "sapphire_charm", name: "Sapphire charm", category: "Misc", expense: 50000, effect: 3, description: "Magic xp", boosts: [{stat: "xp", of: "Magic"}], requires: [{coins: 5000000}],
        tooltip: "Embedded with a rare sapphire, this charm activates more mana channels within your body, providing a much easier time learning magic."},
    {id: "study_desk", name: "Study desk", category: "Misc", expense: 1000000, effect: 2, description: "Skill xp", boosts: [{stat: "xp", of: "skills"}], requires: [{coins: 100000000}],
        tooltip: "A dedicated area which provides many fine stationery and equipment designed for furthering your progress in research."},
    {id: "library", name: "Library", category: "Misc", expense: 10000000, effect: 1.5, description: "Skill xp", boosts: [{stat: "xp", of: "skills"}], requires: [{coins: 1000000000}],
        tooltip: "Stores a collection of books, each containing vast amounts of information from basic life skills to complex magic spells."},
]

// Parts of the game that are hidden until their requirements are met. A
// category unlock reveals that category's rows; the others reveal the page
// element with the given id.
const unlocks = [
    {id: "the_arcane_association", name: "The Arcane Association", category: "The Arcane Association", requires: [{task: "concentration", level: 200}, {task: "meditation", level: 200}]},
    {id: "dark_magic", name: "Dark magic", category: "Dark magic", requires: [{evil: 1}]},
    {id: "shop", name: "Shop", elementId: "shopTabButton", permanent: true, requires: [{coins: 750}]},
    {id: "rebirth_tab", name: "Rebirth tab", elementId: "rebirthTabButton", requires: [{age: 25}]},
    {id: "rebirth_note_1", name: "Rebirth note 1", elementId: "rebirthNote1", requires: [{age: 45}]},
    {id: "rebirth_note_2", name: "Rebirth note 2", elementId: "rebirthNote2", requires: [{age: 65}]},
    {id: "rebirth_note_3", name: "Rebirth note 3", elementId: "rebirthNote3", requires: [{age: 200}]},
    {id: "evil_info", name: "Evil info", elementId: "evilInfo", requires: [{evil: 1}]},
    {id: "time_warping_info", name: "Time warping info", elementId: "timeWarping", requires: [{task: "mage", level: 10}]},
    {id: "automation", name: "Automation", elementId: "automation", permanent: true, requires: [{age: 20}]},
    {id: "quick_task_display", name: "Quick task display", elementId: "quickTaskDisplay", permanent: true, requires: [{age: 20}]},
]

// What a new life starts with (ids)
const startingItems = {job: "beggar", skill: "concentration", property: "homeless"}

// Id <-> display name for every job, skill, item and unlock. Prototype-free
// so lookups of untrusted keys (e.g. from a save) can't hit Object methods.
const namesById = Object.create(null)
const idsByName = Object.create(null)
for (const definition of [...jobs, ...skills, ...items, ...unlocks]) {
    namesById[definition.id] = definition.name
    idsByName[definition.name] = definition.id
}

const jobBaseData = definitionsByName(jobs)
const jobCategories = namesByCategory(jobs)

const skillBaseData = definitionsByName(skills)
const skillCategories = namesByCategory(skills)

const itemBaseData = definitionsByName(items)
const itemCategories = namesByCategory(items)

const headerRowColors = {
    "Common work": "#55a630",
    "Military": "#e63946",
    "The Arcane Association": "#C71585",
    "Fundamentals": "#4a4e69",
    "Combat": "#ff704d",
    "Magic": "#875F9A",
    "Dark magic": "#73000f",
    "Properties": "#219ebc",
    "Misc": "#b56576",
}

// Entity name -> tooltip text
const tooltips = {}
for (const definition of [...jobs, ...skills, ...items]) {
    tooltips[definition.name] = definition.tooltip
}
