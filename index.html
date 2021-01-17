<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" type="text/css" href="css/styles.css">
    <link rel="stylesheet" type="text/css" href="css/dark.css">
    <link rel="stylesheet" href="https://www.w3schools.com/w3css/4/w3.css"> 
    <title>Progress Knight</title>
</head>
<body id="body" class="dark">
    <div class="w3-margin"> 
        <h1>Progress Knight</h1>
        <div style="width: 1220px; height: 600px"> 
            <div class="panel w3-padding" style="width: 300px; height: auto; float: left">
                <span id="deathText">
                    <div style="font-size: large; color: red">Age has caught up to you</div>
                    <div class="sidebar-element" style="color: gray">Your age has met your lifespan, use the amulet to rebirth before you pass away</div>
                </span>

                <div class="" style="font-size: large">Age <span id="ageDisplay">14</span> Day <span id="dayDisplay">0</span></div>
                <div class="sidebar-element" style="color: gray">Lifespan: <span id="lifespanDisplay">70</span> years</div>
                
                <button id="pauseButton" class="w3-button button sidebar-element" onClick="setPause()">Pause</button>

                <span id="automation" class="inline" style="margin-left: 8px">
                    <span>
                        <div class="inline">Auto-promote</div>
                        <input type="checkbox" class="inline" id="autoPromote">
                    </span>
                    </br>
                    <span>
                        <div class="inline">Auto-learn</div>
                        <input type="checkbox" class="inline sidebar-element" id="autoLearn">
                    </span>
                </span>

                <div style="font-size: large" id="coinDisplay">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <div style="color: gray">Balance (in coins)</div>

                <ul class="sidebar-element" style="padding-left: 20px;">
                    <li><span style="color: rgb(9, 160, 230)">Net/day: </span ><b id="signDisplay"></b><span id="netDisplay">
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                    </span></li>
                    <li><span style="color: green">Income/day: </span><span id="incomeDisplay">
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                    </span></li>
                    <li><span style="color: red">Expense/day: </span><span id="expenseDisplay">
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                    </span></li>
                </ul>

                <span id="quickTaskDisplay">
                    <div style="width: 230px" class="small-margin inline job progress-bar progressBar">
                        <div class="progress-fill progressFill" style="background-color:rgb(225, 165, 0)"></div>
                        <div class="progress-text name">Task</div>
                    </div>
                    <div class="sidebar-element" style="color: gray">Current job</div>

                    <div style="width: 230px" class="small-margin skill progress-bar progressBar">
                        <div class="progress-fill progressFill" style="background-color:rgb(225, 165, 0)"></div>
                        <div class="progress-text name">Task</div>              
                    </div>
                    <div class="sidebar-element" style="color: gray">Current skill</div>
                </span>

                <div style="font-size: large"><span style="color: rgb(15, 105, 207)">Happiness: </span><span id="happinessDisplay"></span></div>
                <div style="color: gray" class="sidebar-element">Affects all xp gain</div>

                <span id="evilInfo">
                    <div style="font-size: large"><span style="color: rgb(200, 0, 0)">Evil: </span><span id="evilDisplay"></span></div>
                    <div style="color: gray" class="sidebar-element">Affects dark magic xp gain</div>
                </span>

                <!--
                <span id="scheduling">
                    <div style="font-size: large">Scheduling</div>
                    <div style="color: gray" class="sidebar-element">Schedule time to jobs/skills</div>
                    <span style="height: 30px"> 
                        <p style="width: 5px">Jobs</br>(32%)</p>
                        <input id="schedulingSlider" class="slider" type="range" min="0" max="100" value="0">
                        <p style="width: 5px">Skills</br>(68%)</p>
                    </span>
                </span>
                -->

                <span id="timeWarping">
                    <div style="font-size: large"><span style="color: rgb(204, 34, 219)">Time warping: </span><span id="timeWarpingDisplay"></span></div>
                    <div style="color: gray">Affects game speed</div>
                    <button id="timeWarpingButton" class="w3-button button sidebar-element" style="margin-top: 5px; width:150px" onClick="setTimeWarping()">Enable warp</button>
                </span>
            </div>

            <div class="panel w3-margin-left" style="width: 900px; height: 40px; float: left">
                <div class="w3-button w3-bar-item tabButton" id="jobTabButton" onClick="setTab(this, 'jobs')">Jobs</div>
                <div class="w3-button w3-bar-item tabButton" onClick="setTab(this, 'skills')">Skills</div>
                <div class="w3-button w3-bar-item tabButton" id="shopTabButton" onClick="setTab(this, 'shop')">Shop</div>
                <div class="w3-button w3-bar-item tabButton" id="rebirthTabButton" onClick="setTab(this, 'rebirth')">Amulet</div>
                <div class="w3-button w3-bar-item tabButton" onClick="setTab(this, 'settings')" style="float: right">Settings</div>
            </div>

            <div class="panel w3-margin-left w3-margin-top w3-padding" style="width: 900px; height: auto; float: left">
                <template class="headerRowTaskTemplate">
                    <tr>
                        <th class="category" style="width: 250px">Job</th>
                        <th>Level</th>
                        <th class="valueType">Value type</th>
                        <th>Xp/day</th>
                        <th>Xp left</th>
                        <th class="maxLevel">Max level</th>
                        <th class="skipSkill">Skip</th>
                    </tr>
                </template>

                <template class="headerRowItemTemplate">
                    <tr>
                        <th class="category" style="width: 250px">Item</th>
                        <th style="width: 100px">Active</th>
                        <th style="width: 250px">Effect</th>
                        <th>Expense/day</th>
                    </tr>
                </template>

                <template class="rowTaskTemplate">
                    <tr>
                        <td>
                            <div class="progress-bar progressBar tooltip">
                                <div class="progress-fill progressFill"></div>
                                <div class="progress-text name">Task</div>
                                <span class="tooltipText"></span>
                            </div>
                        </td>
                        <td class="level">Level</td>
                        <td class="value">
                            <div class="effect"></div>
                            <div class="income">
                                <span></span>
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </td>
                        <td class="xpGain">Xp/day</td>
                        <td class="xpLeft">Xp left</td>
                        <td class="maxLevel">Max level</td>
                        <td class="skipSkill">
                            <input class="checkbox" type="checkbox"></input>
                        </td>
                    </tr>
                </template>

                <template class="rowItemTemplate">
                    <tr>
                        <td>
                            
                            <button class="button item-button tooltip">
                                <span class="name"></span>
                                <span class="tooltipText">tooltip</span>
                            </button>
                            
                        </td>
                        <td>
                            <div class="w3-border w3-circle" style="width: 40px; height: 40px; padding: 7px">
                                <div class="active w3-circle" style="width: 24px; height: 24px;"></div>
                            </div>
                        </td>
                        <td class="effect"></td>
                        <td class="expense">
                            <span></span>
                            <span></span>
                            <span></span>
                            <span></span>
                        </td>
                    </tr>
                </template>

                <template class="requiredRowTemplate">
                    <td class="w3-text-gray" style="padding-left: 16px" colspan=5>
                        Required: 
                        <span class="value" colspan=5>
                            <span class="levels"></span>
                            <span class="coins">
                                <span></span>
                                <span></span>
                                <span></span>
                                <span></span>
                            </span>
                            <span style="color: rgb(200, 0, 0)" class="evil"></span>
                        </span>
                    </td> 
                </template>

                <div class="tab" id="jobs">
                    <table id="jobTable" class="w3-table w3-bordered">
                    </table>
                </div>

                <div class="tab" id="skills">
                    <table id="skillTable" class="w3-table w3-bordered">
                    </table>
                </div>

                <div class="tab" id="shop">
                    <table id="itemTable" class="w3-table w3-bordered">
                    </table>
                </div>

                <div class="tab" id="rebirth">
                    <ul>
                        <li style="margin: 8px;">
                            You stumble across a strange looking amulet on your 25th birthday. It does not look like
                            it has any worth on the market given that it's made from cheap-looking copper. However, you
                            feel a weird urge to keep the amulet, so you slip it into your pocket for safekeeping.
                        </li>
                        <li style="margin: 8px;" id="rebirthNote1">
                            On your 45th birthday, you feel the amulet shiver uncontrollably in your pocket. You take it
                            out and the constant shivering suddenly stops. More to your bizarre surprise, you notice
                            a strange etching on the centre of the amulet.
                        </li>
                        <li style="margin: 8px;" id="rebirthNote2">
                            <div style="margin-bottom: 8px">
                                On your 65th birthday, you once again encounter the strange, unexplained shivering from your
                                amulet. But this time, a living eyeball emerges from the centre. Although terribly frightened,
                                you realise you do not have many years to live left anyway so you consider touching the eye
                                to see what happens.
                            </div>
                            <i style="color: grey">
                                By touching the eyeball, you will be reborn and have to restart life again, losing all your levels and coins.
                                However, you will gain <b>xp multipliers</b> for your jobs and skills equivalent to: <b>1 + the max level of the skill or job / 10.</b>
                                This means you will learn everything again much more quickly than you did in your previous life. <span style="color: rgb(200, 0, 0)">
                                Something tells you that the amulet might transform even further after living for <b>2 whole centuries</b>...</span>
                            </i>
                            </br>
                            <button class="w3-button button" style="margin-bottom: 8px; margin-top: 8px" onClick="rebirthOne()">Touch the eye</button>
                            </br>
                        </li>
                        <li style="margin: 8px;" id="rebirthNote3">
                            <div style="margin-bottom: 8px;">
                                Your gut instinct was right. The moment you hit the grand age of 200, you hear an ominous hum coming from the amulet.
                                A mouth emerges from its surface and begins to cackle, and proceeds to say: "So you've made it this far... Are you ready to embrace evil?"
                            </div>
                            <i style="color: rgb(200, 0, 0)">
                                If you decide to embrace evil, all of your levels, coins and even max levels will be reset.
                                You will be reborn as a fresh slate. However, you will unlock a new line of skills and gain
                                <b><span id="evilGainDisplay"></span> evil</b>, which will heavily impact your future lives.
                            </i>
                            </br>
                                <button class="w3-button button" style="margin-bottom: 8px; margin-top: 8px" onClick="rebirthTwo()">Embrace evil</button>
                            </br>
                        </li>
                    </ul>
                </div>

                <div class="tab" id="settings">
                    <ul>
                        <li>
                            <h2>Import/export save</h2>
                            <button class="w3-button button" onClick="importGameData()">Import</button>
                            <button class="w3-button button" onClick="exportGameData()">Export</button>
                            <form style="margin-top: 16px"> 
                                <input id="importExportBox" type="text" style="width:300px; height:30px"></input>
                            </form>
                        </li>
                        <li>
                            <h2>Toggle light/dark mode</h2>
                            <button class="w3-button button" onClick="setLightDarkMode()">Toggle</button>
                        </li>
                        <li>
                            <h2>Join the discord community!</h2>
                            <a href="https://discord.gg/fTRS4pHGka" target="_blank">
                                <img src="https://cdn.icon-icons.com/icons2/2108/PNG/512/discord_icon_130958.png" width="100" height="100"></img>
                            </a>
                        </li>
                        <li>
                            <h2>Hard reset game</h2>
                            <button class="w3-button button w3-red" onClick="resetGameData()">Reset</button>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</body>

<script type="text/javascript" src="js/HackTimer.js"></script>
<script type="text/javascript" src="js/classes.js"></script>
<script type="text/javascript" src="js/main.js"></script>

</html>