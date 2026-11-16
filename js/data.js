"use strict"

// Static game data. Each job, skill and item is defined once, with a stable
// id that saves can refer to even if its display name changes.
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
    {id: "beggar", name: "Beggar", category: "Common work", maxXp: 50, income: 5,
        tooltip: "Struggle day and night for a couple of copper coins. It feels like you are at the brink of death each day."},
    {id: "farmer", name: "Farmer", category: "Common work", maxXp: 100, income: 9,
        tooltip: "Plow the fields and grow the crops. It's not much but it's honest work."},
    {id: "fisherman", name: "Fisherman", category: "Common work", maxXp: 200, income: 15,
        tooltip: "Reel in various fish and sell them for a handful of coins. A relaxing but still a poor paying job."},
    {id: "miner", name: "Miner", category: "Common work", maxXp: 400, income: 40,
        tooltip: "Delve into dangerous caverns and mine valuable ores. The pay is quite meager compared to the risk involved."},
    {id: "blacksmith", name: "Blacksmith", category: "Common work", maxXp: 800, income: 80,
        tooltip: "Smelt ores and carefully forge weapons for the military. A respectable and OK paying commoner job."},
    {id: "merchant", name: "Merchant", category: "Common work", maxXp: 1600, income: 150,
        tooltip: "Travel from town to town, bartering fine goods. The job pays decently well and is a lot less manually-intensive."},

    // Military
    {id: "squire", name: "Squire", category: "Military", maxXp: 100, income: 5,
        tooltip: "Carry around your knight's shield and sword along the battlefield. Very meager pay but the work experience is quite valuable."},
    {id: "footman", name: "Footman", category: "Military", maxXp: 1000, income: 50,
        tooltip: "Put down your life to battle with enemy soldiers. A courageous, respectable job but you are still worthless in the grand scheme of things."},
    {id: "veteran_footman", name: "Veteran footman", category: "Military", maxXp: 10000, income: 120,
        tooltip: "More experienced and useful than the average footman, take out the enemy forces in battle with your might. The pay is not that bad."},
    {id: "knight", name: "Knight", category: "Military", maxXp: 100000, income: 300,
        tooltip: "Slash and pierce through enemy soldiers with ease, while covered in steel from head to toe. A decently paying and very respectable job."},
    {id: "veteran_knight", name: "Veteran knight", category: "Military", maxXp: 1000000, income: 1000,
        tooltip: "Utilising your unmatched combat ability, slaughter enemies effortlessly. Most footmen in the military would never be able to acquire such a well paying job like this."},
    {id: "elite_knight", name: "Elite knight", category: "Military", maxXp: 7500000, income: 3000,
        tooltip: "Obliterate squadrons of enemy soldiers in one go with extraordinary proficiency, while equipped with the finest gear. Such a feared unit on the battlefield is paid extremely well."},
    {id: "holy_knight", name: "Holy knight", category: "Military", maxXp: 40000000, income: 15000,
        tooltip: "Collapse entire armies in mere seconds with your magically imbued blade. The handful of elite knights who attain this level of power are showered with coins."},
    {id: "legendary_knight", name: "Legendary knight", category: "Military", maxXp: 150000000, income: 50000,
        tooltip: "Feared worldwide, obliterate entire nations in a blink of an eye. Roughly every century, only one holy knight is worthy of receiving such an esteemed title."},

    // The Arcane Association
    {id: "student", name: "Student", category: "The Arcane Association", maxXp: 100000, income: 100,
        tooltip: "Study the theory of mana and practice basic spells. There is minor pay to cover living costs, however, this is a necessary stage in becoming a mage."},
    {id: "apprentice_mage", name: "Apprentice mage", category: "The Arcane Association", maxXp: 1000000, income: 1000,
        tooltip: "Under the supervision of a mage, perform basic spells against enemies in battle. Generous pay will be provided to cover living costs."},
    {id: "mage", name: "Mage", category: "The Arcane Association", maxXp: 10000000, income: 7500,
        tooltip: "Turn the tides of battle through casting intermediate spells and mentor other apprentices. The pay for this particular job is extremely high."},
    {id: "wizard", name: "Wizard", category: "The Arcane Association", maxXp: 100000000, income: 50000,
        tooltip: "Utilise advanced spells to ravage and destroy entire legions of enemy soldiers. Only a small percentage of mages deserve to attain this role and are rewarded with an insanely high pay."},
    {id: "master_wizard", name: "Master wizard", category: "The Arcane Association", maxXp: 10000000000, income: 250000,
        tooltip: "Blessed with unparalleled talent, perform unbelievable feats with magic at will. It is said that a master wizard has enough destructive power to wipe an empire off the map."},
    {id: "chairman", name: "Chairman", category: "The Arcane Association", maxXp: 1000000000000, income: 1000000,
        tooltip: "Spend your days administrating The Arcane Association and investigate the concepts of true immortality. The chairman receives ludicrous amounts of pay daily."},
]

const skills = [
    // Fundamentals
    {id: "concentration", name: "Concentration", category: "Fundamentals", maxXp: 100, effect: 0.01, description: "Skill xp",
        tooltip: "Improve your learning speed through practising intense concentration activities."},
    {id: "productivity", name: "Productivity", category: "Fundamentals", maxXp: 100, effect: 0.01, description: "Job xp",
        tooltip: "Learn to procrastinate less at work and receive more job experience per day."},
    {id: "bargaining", name: "Bargaining", category: "Fundamentals", maxXp: 100, effect: -0.01, description: "Expenses",
        tooltip: "Study the tricks of the trade and persuasive skills to lower any type of expense."},
    {id: "meditation", name: "Meditation", category: "Fundamentals", maxXp: 100, effect: 0.01, description: "Happiness",
        tooltip: "Fill your mind with peace and tranquility to tap into greater happiness from within."},

    // Combat
    {id: "strength", name: "Strength", category: "Combat", maxXp: 100, effect: 0.01, description: "Military pay",
        tooltip: "Condition your body and strength through harsh training. Stronger individuals are paid more in the military."},
    {id: "battle_tactics", name: "Battle tactics", category: "Combat", maxXp: 100, effect: 0.01, description: "Military xp",
        tooltip: "Create and revise battle strategies, improving experience gained in the military."},
    {id: "muscle_memory", name: "Muscle memory", category: "Combat", maxXp: 100, effect: 0.01, description: "Strength xp",
        tooltip: "Strengthen your neurons through habit and repetition, improving strength gains throughout the body."},

    // Magic
    {id: "mana_control", name: "Mana control", category: "Magic", maxXp: 100, effect: 0.01, description: "T.A.A. xp",
        tooltip: "Strengthen your mana channels throughout your body, aiding you in becoming a more powerful magical user."},
    {id: "immortality", name: "Immortality", category: "Magic", maxXp: 100, effect: 0.01, description: "Longer lifespan",
        tooltip: "Lengthen your lifespan through the means of magic. However, is this truly the immortality you have tried seeking for...?"},
    {id: "time_warping", name: "Time warping", category: "Magic", maxXp: 100, effect: 0.01, description: "Gamespeed",
        tooltip: "Bend space and time through forbidden techniques, resulting in a faster gamespeed."},
    {id: "super_immortality", name: "Super immortality", category: "Magic", maxXp: 100, effect: 0.01, description: "Longer lifespan",
        tooltip: "Through harnessing ancient, forbidden techniques, lengthen your lifespan drastically beyond comprehension."},

    // Dark magic
    {id: "dark_influence", name: "Dark influence", category: "Dark magic", maxXp: 100, effect: 0.01, description: "All xp",
        tooltip: "Encompass yourself with formidable power bestowed upon you by evil, allowing you to pick up and absorb any job or skill with ease."},
    {id: "evil_control", name: "Evil control", category: "Dark magic", maxXp: 100, effect: 0.01, description: "Evil gain",
        tooltip: "Tame the raging and growing evil within you, improving evil gain in-between rebirths."},
    {id: "intimidation", name: "Intimidation", category: "Dark magic", maxXp: 100, effect: -0.01, description: "Expenses",
        tooltip: "Learn to emit a devilish aura which strikes extreme fear into other merchants, forcing them to give you heavy discounts."},
    {id: "demon_training", name: "Demon training", category: "Dark magic", maxXp: 100, effect: 0.01, description: "All xp",
        tooltip: "A mere human body is too feeble and weak to withstand evil. Train with forbidden methods to slowly manifest into a demon, capable of absorbing knowledge rapidly."},
    {id: "blood_meditation", name: "Blood meditation", category: "Dark magic", maxXp: 100, effect: 0.01, description: "Evil gain",
        tooltip: "Grow and culture the evil within you through the sacrifice of other living beings, drastically increasing evil gain."},
    {id: "demons_wealth", name: "Demon's wealth", category: "Dark magic", maxXp: 100, effect: 0.002, description: "Job pay",
        tooltip: "Through the means of dark magic, multiply the raw matter of the coins you receive from your job."},
]

const itemBaseData = {
    "Homeless": {name: "Homeless", expense: 0, effect: 1},
    "Tent": {name: "Tent", expense: 15, effect: 1.4},
    "Wooden hut": {name: "Wooden hut", expense: 100, effect: 2},
    "Cottage": {name: "Cottage", expense: 750, effect: 3.5},
    "House": {name: "House", expense: 3000, effect: 6},
    "Large house": {name: "Large house", expense: 25000, effect: 12},
    "Small palace": {name: "Small palace", expense: 300000, effect: 25},
    "Grand palace": {name: "Grand palace", expense: 5000000, effect: 60},

    "Book": {name: "Book", expense: 10, effect: 1.5, description: "Skill xp"},
    "Dumbbells": {name: "Dumbbells", expense: 50, effect: 1.5, description: "Strength xp"},
    "Personal squire": {name: "Personal squire", expense: 200, effect: 2, description: "Job xp"},
    "Steel longsword": {name: "Steel longsword", expense: 1000, effect: 2, description: "Military xp"},
    "Butler": {name: "Butler", expense: 7500, effect: 1.5, description: "Happiness"},
    "Sapphire charm": {name: "Sapphire charm", expense: 50000, effect: 3, description: "Magic xp"},
    "Study desk": {name: "Study desk", expense: 1000000, effect: 2, description: "Skill xp"},
    "Library": {name: "Library", expense: 10000000, effect: 1.5, description: "Skill xp"},
}

const jobBaseData = definitionsByName(jobs)
const jobCategories = namesByCategory(jobs)

const skillBaseData = definitionsByName(skills)
const skillCategories = namesByCategory(skills)

const itemCategories = {
    "Properties": ["Homeless", "Tent", "Wooden hut", "Cottage", "House", "Large house", "Small palace", "Grand palace"],
    "Misc": ["Book", "Dumbbells", "Personal squire", "Steel longsword", "Butler", "Sapphire charm", "Study desk", "Library"]
}

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

const tooltips = {
    "Homeless": "Sleep on the uncomfortable, filthy streets while almost freezing to death every night. It cannot get any worse than this.",
    "Tent": "A thin sheet of tattered cloth held up by a couple of feeble, wooden sticks. Horrible living conditions but at least you have a roof over your head.",
    "Wooden hut": "Shabby logs and dirty hay glued together with horse manure. Much more sturdy than a tent, however, the stench isn't very pleasant.",
    "Cottage": "Structured with a timber frame and a thatched roof. Provides decent living conditions for a fair price.",
    "House": "A building formed from stone bricks and sturdy timber, which contains a few rooms. Although quite expensive, it is a comfortable abode.",
    "Large house": "Much larger than a regular house, which boasts even more rooms and multiple floors. The building is quite spacious but comes with a hefty price tag.",
    "Small palace": "A very rich and meticulously built structure rimmed with fine metals such as silver. Extremely high expenses to maintain for a lavish lifestyle.",
    "Grand palace": "A grand residence completely composed of gold and silver. Provides the utmost luxurious and comfortable living conditions possible for a ludicrous price.",

    "Book": "A place to write down all your thoughts and discoveries, allowing you to learn a lot more quickly.",
    "Dumbbells": "Heavy tools used in strenuous exercise to toughen up and accumulate strength even faster than before. ",
    "Personal squire": "Assists you in completing day to day activities, giving you more time to be productive at work.",
    "Steel longsword": "A fine blade used to slay enemies even quicker in combat and therefore gain more experience.",
    "Butler": "Keeps your household clean at all times and also prepares three delicious meals per day, leaving you in a happier, stress-free mood.",
    "Sapphire charm": "Embedded with a rare sapphire, this charm activates more mana channels within your body, providing a much easier time learning magic.",
    "Study desk": "A dedicated area which provides many fine stationery and equipment designed for furthering your progress in research.",
    "Library": "Stores a collection of books, each containing vast amounts of information from basic life skills to complex magic spells.",
}

for (const job of jobs) tooltips[job.name] = job.tooltip
for (const skill of skills) tooltips[skill.name] = skill.tooltip
