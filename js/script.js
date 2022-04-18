"use strict";

(() => {
    // add app modules when window load (without resources)
    window.addEventListener("DOMContentLoaded", () => {
        navModule();
        setupModule();
        clockModule();
    });

    const layouts = {
        home: document.querySelector(".home"),
        clock: document.querySelector(".clock-container"),
        modes: document.querySelector(".modes"),
        settings: document.querySelector(".settings"),
        about: document.querySelector(".about"),
    };

    const audioElements = {
        selected: document.querySelectorAll("audio").item(0),
        sound1: document.querySelectorAll("audio").item(0),
        sound2: document.querySelectorAll("audio").item(1),
    };

    const navModule = function entireNavigation() {
        const ANIMATION_TIME_MS = 500;

        const init = function () {
            homePage();
            closeBtns();
            clockPage();
            modePage();
            hidingWindow();
        };

        const toggleFooter = function () {
            const footer = document.querySelector(".footer");
            footer.classList.toggle("display-none");
        };

        const toggleClockFullscreen = function () {
            const isHomeOpen = !layouts.home.classList.contains("display-none");
            const isClockOpen = !layouts.clock.classList.contains("display-none");

            if (document.fullscreenElement) {
                if (isHomeOpen) {
                    document.exitFullscreen();
                }
            } else if (isClockOpen && document.fullscreenEnabled) {
                const rootElement = document.documentElement;
                rootElement.requestFullscreen({ navigationUI: "hide" });
            }
        };

        const scrollToTop = function () {
            window.scrollTo(0, 0);
        };

        const openLayout = function (oldLayout, newLayout) {
            const isLayoutOld = Boolean(oldLayout?.parentElement?.classList?.contains("content"));
            const isLayoutNew = Boolean(newLayout?.parentElement?.classList?.contains("content"));

            if (isLayoutOld && isLayoutNew) {
                oldLayout.classList.add("pointer-events-none");

                setTimeout(() => {
                    oldLayout.classList.add("display-none");
                    oldLayout.classList.remove("pointer-events-none");
                    newLayout.classList.remove("display-none");

                    const isClockLayout = newLayout === layouts.clock || oldLayout === layouts.clock;

                    if (isClockLayout) {
                        // clock layout does not have footer
                        // footer must be toggle when opening or closing clock layout
                        toggleFooter();
                        toggleClockFullscreen();
                    }

                    scrollToTop();
                }, ANIMATION_TIME_MS);
            } else {
                console.error(`openLayout(), wrong param: ${isLayoutOld}, ${isLayoutNew}.`);
            }
        };

        const homePage = function navigationOnHomePage() {
            const menuItems = layouts.home.querySelectorAll(".menu .menu__elem");

            for (const item of menuItems) {
                const newLayout = layouts[item.dataset.link];

                item.addEventListener("click", () => {
                    openLayout(layouts.home, newLayout);

                    const isOpensSettings = newLayout === layouts.settings;

                    if (isOpensSettings) {
                        // settings opens from clock or home
                        // need to add source information to settings
                        newLayout.dataset.from = "home";
                    }
                });
            }
        };

        const animateItem = function (item, timeMs, animClass) {
            const isHTMLElement = Boolean(item?.classList);
            const isNumber = typeof timeMs === "number";
            const isString = typeof animClass === "string";

            if (isHTMLElement && isNumber && isString) {
                item.classList.add(animClass);

                setTimeout(() => {
                    item.classList.remove(animClass);
                }, timeMs);
            } else {
                console.error(`animateItem(), wrong param: ${isHTMLElement}, ${isNumber}, ${isString}.`);
            }
        };

        const closeBtns = function navigationForCloseBtns() {
            const closeButtons = document.querySelectorAll(".close-btn");

            for (const btn of closeButtons) {
                const oldLayout = btn.parentElement;

                btn.addEventListener("click", () => {
                    const isClosesSettings = oldLayout === layouts.settings;
                    const newLayout = isClosesSettings ? layouts[oldLayout.dataset.from] : layouts.home;

                    openLayout(oldLayout, newLayout);
                    animateItem(btn, ANIMATION_TIME_MS, "close-btn--animate");
                });
            }
        };

        const clockPage = function navigationOnClockPage() {
            const closeBtn = layouts.clock.querySelector("li[data-function=close]");
            closeBtn.addEventListener("click", () => {
                openLayout(layouts.clock, layouts.home);
            });

            const settingsBtn = layouts.clock.querySelector("li[data-function=settings]");
            settingsBtn.addEventListener("click", () => {
                openLayout(layouts.clock, layouts.settings);
                layouts.settings.dataset.from = "clock";
            });
        };

        const animateModeView = function () {
            const WAIT_TIME_FOR_HOME = ANIMATION_TIME_MS;
            const modeView = layouts.home.querySelector(".mode-view__con");

            // wait for closing animation to finish before starting this one
            setTimeout(() => {
                animateItem(modeView, ANIMATION_TIME_MS, "mode-view__con--animate");
            }, WAIT_TIME_FOR_HOME);
        };

        const modePage = function navigationOnModePage() {
            const modesBtns = layouts.modes.querySelectorAll(".modes__elem");
            const customModeBtn = layouts.modes.querySelector(".sliders .app-btn");

            const modesChangers = [...modesBtns, customModeBtn];

            for (const modeChanger of modesChangers) {
                modeChanger.addEventListener("click", () => {
                    openLayout(layouts.modes, layouts.home);
                    animateModeView();
                });
            }
        };

        const fullscreenAfterStartGame = function (event) {
            const isClockPart = event.target.classList.contains("clock__part");
            const isStateBtn = event.target.dataset.function === "state";

            // state button contains icon which may also be target of event
            const isStateIcon = event.target.parentElement.dataset.function === "state";

            if (isClockPart || isStateBtn || isStateIcon) {
                toggleClockFullscreen();
                this.removeEventListener("click", fullscreenAfterStartGame);
            }

            const isClockClose = layouts.clock.classList.contains("display-none");

            if (isClockClose) {
                this.removeEventListener("click", fullscreenAfterStartGame);
            }
        };

        const hidingWindow = function eventsWhileHidingWindow() {
            document.addEventListener("visibilitychange", () => {
                if (document.visibilityState === "hidden") {
                    const stateBtn = layouts.clock.querySelector("li[data-function=state]");
                    const isActive = !stateBtn.classList.contains("menu-h__elem--disabled");
                    const hasPauseIcon = Boolean(stateBtn.querySelector(".fa-pause"));

                    if (isActive && hasPauseIcon) {
                        // stop clock if necessary
                        stateBtn.click();
                    }

                    const content = document.querySelector(".content");
                    content.addEventListener("click", fullscreenAfterStartGame);
                }
            });
        };

        return init();
    };

    const setupModule = function changeableSettings() {
        const NUMBER_REGEX = /\d+/;

        // keys to local storage
        // and functions for working with it
        const storage = {
            keys: {
                gameMode: "gameMode",
                darkMode: "darkMode",
                graphicTheme: "graphicTheme",
                audioMute: "audioMute",
                volume: "volume",
                soundTheme: "soundTheme",
                clockOneSide: "clockOneSide",
            },
            isAvailable() {
                try {
                    const testItem = "storageTest";
                    localStorage.setItem(testItem, testItem);
                    localStorage.removeItem(testItem);
                    return true;
                } catch (e) {
                    return false;
                }
            },
            setItem(key, value) {
                if (this.isAvailable()) {
                    localStorage.setItem(key, value);
                }
            },
            removeItem(key) {
                if (this.isAvailable()) {
                    localStorage.removeItem(key);
                }
            },
            getItem(key) {
                if (this.isAvailable()) {
                    return localStorage.getItem(key);
                }
            },
        };

        const init = function () {
            // function below should be called first
            // due to user experience
            loadLocalStorage();

            slidersLogic();
            specialModeSwitcher();
            gameModeSwitchers();
            graphicsSettings();
            soundSettings();
            clockSettings();
        };

        const slidersLogic = function slidersConnectToValues() {
            const sliders = document.querySelectorAll(".slider");

            for (const slider of sliders) {
                const box = slider.querySelector(".slider__box");
                const value = slider.querySelector(".slider__value");

                const suffix = value.textContent.replace(NUMBER_REGEX, "");

                box.addEventListener("change", () => {
                    value.textContent = `${box.value}${suffix}`;
                });
            }
        };

        const specialModeSwitcher = function showOrHideSpecialMode() {
            const SHOW_TIME_MS = 50;
            const HIDE_TIME_MS = 550;

            const switcher = layouts.modes.querySelector("#time-switch");
            const specialMode = layouts.modes.querySelector(".special-mode");

            switcher.addEventListener("click", () => {
                if (switcher.checked) {
                    specialMode.classList.toggle("display-none");

                    setTimeout(() => {
                        specialMode.classList.toggle("special-mode--animate");
                    }, SHOW_TIME_MS);
                } else {
                    specialMode.classList.toggle("special-mode--animate");

                    setTimeout(() => {
                        specialMode.classList.toggle("display-none");
                    }, HIDE_TIME_MS);
                }
            });
        };

        const getCustomModeValue = function () {
            const valueFields = layouts.modes.querySelectorAll(".sliders .slider__value");
            const values = [];

            for (const field of valueFields) {
                values.push(field.textContent.match(NUMBER_REGEX));
            }

            let customModeValue;

            const specialMode = layouts.modes.querySelector(".special-mode");
            const isSpecialModeActive = !specialMode.classList.contains("display-none");

            if (isSpecialModeActive) {
                // special mode shows additional sliders with time and delay
                // which are before the default ones in the document
                const SPACE_CODE = "\xA0";
                customModeValue = `${values[0]} + ${values[1]} ${SPACE_CODE}vs${SPACE_CODE} ${values[2]} + ${values[3]}`;
            } else {
                customModeValue = `${values[2]} + ${values[3]}`;
            }

            return customModeValue;
        };

        const gameModeSwitchers = function updateModeView() {
            const modeView = layouts.home.querySelector(".mode-view__con");
            const switchers = layouts.modes.querySelectorAll(".modes__elem");

            for (const switcher of switchers) {
                const hasDelay = switcher.textContent.indexOf("+") !== -1;
                const gameModeName = hasDelay ? switcher.textContent : `${switcher.textContent}min`;

                switcher.addEventListener("click", () => {
                    modeView.textContent = gameModeName;
                    storage.setItem(storage.keys.gameMode, modeView.textContent);
                });
            }

            const customModeSwitcher = layouts.modes.querySelector(".sliders .app-btn");

            customModeSwitcher.addEventListener("click", () => {
                modeView.textContent = getCustomModeValue();
                storage.setItem(storage.keys.gameMode, modeView.textContent);
            });
        };

        const darkModeSwitcher = function () {
            const TRANSITION_TIME_MS = 300;
            const rootElement = document.documentElement;
            const switcher = layouts.settings.querySelector("#mode-switch");

            switcher.addEventListener("click", () => {
                setTimeout(() => {
                    const isDarkMode = rootElement.classList.toggle("dark-mode");

                    if (isDarkMode) {
                        storage.setItem(storage.keys.darkMode, "true");
                    } else {
                        storage.removeItem(storage.keys.darkMode);
                    }
                }, TRANSITION_TIME_MS);
            });
        };

        const changeTheme = function (themeName) {
            const isString = typeof themeName === "string";

            if (isString) {
                const rootElement = document.documentElement;
                rootElement.classList.remove("capoeira-theme", "sith-theme");

                const isDefault = themeName === "default";

                if (!isDefault) {
                    rootElement.classList.add(`${themeName}-theme`);
                    storage.setItem(storage.keys.graphicTheme, themeName);
                } else {
                    storage.removeItem(storage.keys.graphicTheme);
                }
            } else {
                console.error(`changeTheme(), wrong param: ${isString}.`);
            }
        };

        const changeSelection = function (optionsContainer, selectedOption) {
            const isOptionsContainer = Boolean(optionsContainer?.classList?.contains("option"));
            const isOption = Boolean(selectedOption?.classList?.contains("option__elem"));

            if (isOptionsContainer && isOption) {
                const activeClass = "option__elem--active";
                const activeOption = optionsContainer.querySelector(`.${activeClass}`);

                activeOption.classList.remove(activeClass);
                selectedOption.classList.add(activeClass);
            } else {
                console.error(`changeSelection(), wrong param: ${isOptionsContainer}, ${isOption}.`);
            }
        };

        const optionChooser = function (optionsContainer, changeFunction) {
            const isOptionsContainer = Boolean(optionsContainer?.classList?.contains("option"));
            const isFunction = typeof changeFunction === "function";

            if (isOptionsContainer && isFunction) {
                const options = optionsContainer.querySelectorAll(".option__elem");

                for (const option of options) {
                    const optionName = option.dataset.name;

                    option.addEventListener("click", () => {
                        changeSelection(optionsContainer, option);
                        changeFunction(optionName);
                    });
                }
            } else {
                console.error(`optionChooser(), wrong param: ${isOptionsContainer}, ${isFunction}.`);
            }
        };

        const graphicsSettings = function graphicsSetupFromSettings() {
            darkModeSwitcher();

            const themesContainer = layouts.settings.querySelector("#theme-option");
            optionChooser(themesContainer, changeTheme);
        };

        const audioMuteSwitcher = function () {
            const switcher = layouts.settings.querySelector("#mute-switch");

            switcher.addEventListener("click", () => {
                const isAudioMuted = audioElements.selected.muted;

                if (isAudioMuted) {
                    audioElements.selected.muted = false;
                    audioElements.selected.play();
                    storage.removeItem(storage.keys.audioMute);
                } else {
                    audioElements.selected.muted = true;
                    storage.setItem(storage.keys.audioMute, "true");
                }
            });
        };

        const playOrUnmuteAudio = function () {
            const isAudioMuted = audioElements.selected.muted;

            if (isAudioMuted) {
                const muteSwitcher = layouts.settings.querySelector("#mute-switch");
                muteSwitcher.click();
            } else {
                audioElements.selected.play();
            }
        };

        const audioVolumeChanger = function () {
            const percentToNumber = (percent) => percent * 0.01;
            const volumeSlider = layouts.settings.querySelector(".slider .slider__box");

            volumeSlider.addEventListener("change", () => {
                const newVolume = percentToNumber(volumeSlider.value);

                audioElements.selected.volume = newVolume;
                storage.setItem(storage.keys.volume, newVolume);
                playOrUnmuteAudio();
            });
        };

        const changeSound = function (soundName) {
            const isString = typeof soundName === "string";

            if (isString) {
                const newAudio = audioElements[soundName];

                // copy changeable properties
                newAudio.muted = audioElements.selected.muted;
                newAudio.volume = audioElements.selected.volume;

                audioElements.selected = newAudio;
                storage.setItem(storage.keys.soundTheme, soundName);
                playOrUnmuteAudio();
            } else {
                console.error(`changeSound(), wrong param: ${isString}.`);
            }
        };

        const soundSettings = function soundSetupFromSettings() {
            audioMuteSwitcher();
            audioVolumeChanger();

            const soundsContainer = layouts.settings.querySelector("#sound-option");
            optionChooser(soundsContainer, changeSound);
        };

        const changeClockTextOrientation = function () {
            const fontSizeTwoSide = "calc(100vmin / 5)";
            const fontSizeOneSide = "calc((100vmax - 100px - 2 * min(4vmax, 20px)) / (4.5 * 2))";

            const currentOrientation = layouts.clock.dataset.orientation;
            const clockParts = layouts.clock.querySelectorAll(".clock__part");

            for (const part of clockParts) {
                const partValues = part.firstElementChild;
                const isTwoSideOrientation = currentOrientation === "two-side";

                if (isTwoSideOrientation) {
                    layouts.clock.dataset.orientation = "one-side";

                    const isTopPart = part.classList.contains("clock__part--top");

                    if (isTopPart) {
                        // top part is inverted
                        partValues.style.transform = "rotate(-90deg)";
                    } else {
                        partValues.style.transform = "rotate(90deg)";
                    }

                    partValues.style.fontSize = fontSizeOneSide;
                } else {
                    layouts.clock.dataset.orientation = "two-side";
                    partValues.style.transform = "none";
                    partValues.style.fontSize = fontSizeTwoSide;
                }
            }
        };

        const changeOrientationIcon = function () {
            const iconTwoSide = "fa-long-arrow-left";
            const iconOneSide = "fa-arrows-v";
            const iconElement = layouts.clock.querySelector("li[data-function=orientation]").firstElementChild;

            iconElement.classList.toggle(iconTwoSide);
            const isOneSide = iconElement.classList.toggle(iconOneSide);

            if (isOneSide) {
                storage.setItem(storage.keys.clockOneSide, "true");
            } else {
                storage.removeItem(storage.keys.clockOneSide);
            }
        };

        const clockSettings = function settingsOnClockPage() {
            const textOrientationBtn = layouts.clock.querySelector("li[data-function=orientation]");

            textOrientationBtn.addEventListener("click", () => {
                changeClockTextOrientation();
                changeOrientationIcon();
            });
        };

        const loadGameMode = function () {
            const gameMode = storage.getItem(storage.keys.gameMode);

            if (gameMode) {
                const modeView = layouts.home.querySelector(".mode-view__con");
                modeView.textContent = gameMode;
            }
        };

        const loadGraphicsSettings = function () {
            const rootElement = document.documentElement;
            const darkMode = storage.getItem(storage.keys.darkMode);

            if (darkMode) {
                rootElement.classList.add("dark-mode");

                const switcher = layouts.settings.querySelector("#mode-switch");
                switcher.checked = true;
            }

            const graphicTheme = storage.getItem(storage.keys.graphicTheme);

            if (graphicTheme) {
                rootElement.classList.add(`${graphicTheme}-theme`);

                const themeOption = layouts.settings.querySelector(`li[data-name=${graphicTheme}]`);
                const themesContainer = themeOption.parentElement;
                changeSelection(themesContainer, themeOption);
            }
        };

        const loadSoundSettings = function () {
            // selected sound theme must be loaded first
            const soundTheme = storage.getItem(storage.keys.soundTheme);

            if (soundTheme) {
                audioElements.selected = audioElements[soundTheme];

                const soundOption = layouts.settings.querySelector(`li[data-name=${soundTheme}]`);
                const soundsContainer = soundOption.parentElement;
                changeSelection(soundsContainer, soundOption);
            }

            const audioMute = storage.getItem(storage.keys.audioMute);

            if (audioMute) {
                audioElements.selected.muted = true;

                const switcher = layouts.settings.querySelector("#mute-switch");
                switcher.checked = true;
            }

            const volume = storage.getItem(storage.keys.volume);

            if (volume) {
                const newVolume = parseFloat(volume);
                audioElements.selected.volume = newVolume;

                const numberToPercent = (number) => number * 100;
                const sliderBox = layouts.settings.querySelector(".slider .slider__box");
                const sliderValue = layouts.settings.querySelector(".slider .slider__value");

                sliderBox.value = numberToPercent(newVolume);
                sliderValue.textContent = `${numberToPercent(newVolume)}%`;
            }
        };

        const loadClockSettings = function () {
            const clockOneSide = storage.getItem(storage.keys.clockOneSide);

            if (clockOneSide) {
                changeOrientationIcon();
                changeClockTextOrientation();
            }
        };

        const loadLocalStorage = function loadSettingsFromPreviousSession() {
            loadGameMode();
            loadGraphicsSettings();
            loadSoundSettings();
            loadClockSettings();
        };

        return init();
    };

    const clockModule = function clockLogic() {
        const MS_IN_HOUR = 60 * 60 * 1000;
        const MS_IN_MINUTE = 60 * 1000;
        const MS_IN_SECOND = 1000;
        const activityClass = "clock__part--active";

        // variable to hold active time interval identifier
        let timeInterval;

        // time and delay expressed in milliseconds
        const player1 = {
            moves: 0,
            time: null,
            delay: null,
            clock: {
                part: layouts.clock.querySelectorAll(".clock__part").item(0),
                time: layouts.clock.querySelectorAll(".clock__values > span").item(0),
                info: layouts.clock.querySelectorAll(".clock__values > .clock__info").item(0),
            },
            increaseMoves() {
                this.moves += 1;
            },
            isTimeBelowTwelveSec() {
                return this.time < 12 * MS_IN_SECOND;
            },
        };

        const player2 = {
            moves: 0,
            time: null,
            delay: null,
            clock: {
                part: layouts.clock.querySelectorAll(".clock__part").item(1),
                time: layouts.clock.querySelectorAll(".clock__values > span").item(1),
                info: layouts.clock.querySelectorAll(".clock__values > .clock__info").item(1),
            },
            increaseMoves() {
                this.moves += 1;
            },
            isTimeBelowTwelveSec() {
                return this.time < 12 * MS_IN_SECOND;
            },
        };

        const init = function () {
            clockPreparer();
            clockOperation();
        };

        const setPlayerTime = function (timeNotation, player) {
            const isString = typeof timeNotation === "string";
            const isObject = typeof player === "object";

            if (isString && isObject) {
                const minutesToMs = (min) => min * MS_IN_MINUTE;
                const secondsToMs = (sec) => sec * MS_IN_SECOND;
                const [time, delay = 0] = timeNotation.split("+");

                // in time notation, time is in minutes and delay is in seconds
                player.time = minutesToMs(parseInt(time));
                player.delay = secondsToMs(parseInt(delay));
            } else {
                console.error(`setPlayerTime(), wrong param: ${isString}, ${isObject}.`);
            }
        };

        const setGameMode = function () {
            const gameMode = layouts.home.querySelector(".mode-view__con").textContent;
            let timeNotation1;
            let timeNotation2;

            const hasVariousTimes = gameMode.indexOf("vs") !== -1;

            if (hasVariousTimes) {
                [timeNotation1, timeNotation2] = gameMode.split("vs");
            } else {
                timeNotation1 = gameMode;
                timeNotation2 = gameMode;
            }

            setPlayerTime(timeNotation1, player1);
            setPlayerTime(timeNotation2, player2);
            player1.clock.time.textContent = timeNotation1.trim();
            player2.clock.time.textContent = timeNotation2.trim();
        };

        const resetInfo = function () {
            player1.moves = 0;
            player2.moves = 0;

            const startupInfo = "tap to start";
            player1.clock.info.textContent = startupInfo;
            player2.clock.info.textContent = startupInfo;

            const classToRemove = ["clock__info--active-black", "clock__info--active-white"];
            player1.clock.info.classList.remove(...classToRemove);
            player2.clock.info.classList.remove(...classToRemove);
        };

        const removeActivityClass = function () {
            player1.clock.part.classList.remove(activityClass);
            player2.clock.part.classList.remove(activityClass);
        };

        // disable selected and enable not selected
        const disableMenuItems = function (...selectedItems) {
            const classDisable = "menu-h__elem--disabled";
            const menuItems = layouts.clock.querySelectorAll(".clock__menu li");

            for (let i = 0; i < menuItems.length; i++) {
                const isSelectedToDisable = selectedItems.includes(i + 1);

                if (isSelectedToDisable) {
                    menuItems[i].classList.add(classDisable);
                } else {
                    menuItems[i].classList.remove(classDisable);
                }
            }
        };

        const changeStateIcon = function () {
            const iconPlay = "fa-play";
            const iconPause = "fa-pause";
            const iconElement = layouts.clock.querySelector("li[data-function=state]").firstElementChild;

            iconElement.classList.toggle(iconPlay);
            iconElement.classList.toggle(iconPause);
        };

        const resetClock = function () {
            setGameMode();
            resetInfo();
            removeActivityClass();
            disableMenuItems(2, 3);
            player1.clock.part.classList.remove("pointer-events-none");
            player2.clock.part.classList.remove("pointer-events-none");

            const hasPlayIcon = Boolean(layouts.clock.querySelector(".clock__menu .fa-play"));

            if (hasPlayIcon) {
                changeStateIcon();
            }
        };

        const clockPreparer = function initializeClockBeforeGame() {
            const openBtn = layouts.home.querySelector("li[data-link=clock]");
            openBtn.addEventListener("click", resetClock);
        };

        const getTimeFromMs = function (msec) {
            const isNumber = typeof msec === "number";

            if (isNumber) {
                let timeString = "";
                const isPositiveNumber = msec > 0;

                if (isPositiveNumber) {
                    const msToHours = (ms) => Math.floor(ms / MS_IN_HOUR);
                    const msToMinutes = (ms) => Math.floor(ms / MS_IN_MINUTE);
                    const msToSeconds = (ms) => Math.floor(ms / MS_IN_SECOND);

                    const hours = msToHours(msec);
                    msec %= MS_IN_HOUR;

                    const minutes = msToMinutes(msec);
                    msec %= MS_IN_MINUTE;

                    const seconds = msToSeconds(msec);
                    msec %= MS_IN_SECOND;

                    const hundredsOfMs = Math.floor(msec / 100);

                    if (hours !== 0) {
                        timeString += `0${hours}:`;
                    }

                    if (hours !== 0 || minutes !== 0) {
                        timeString += minutes >= 10 ? `${minutes}:` : `0${minutes}:`;
                    }

                    if (hours !== 0 || minutes !== 0 || seconds >= 10) {
                        timeString += seconds >= 10 ? seconds : `0${seconds}`;
                    } else {
                        timeString += `${seconds}.${hundredsOfMs}`;
                    }
                } else {
                    // end time value
                    timeString = "0.0";
                }

                return timeString;
            } else {
                console.error(`getTimeFromMs(), wrong param: ${isNumber}.`);
            }
        };

        const clockStart = function (player) {
            const isObject = typeof player === "object";

            if (isObject) {
                // helps not to double interval on same player
                const isPlayerActive = player.clock.part.classList.contains(activityClass);

                // helps to resume interval
                const isIntervalCleared = !Boolean(timeInterval);

                if (isIntervalCleared || !isPlayerActive) {
                    clearInterval(timeInterval);

                    // when time is under 10 seconds clock shows hundreds of milliseconds
                    // so interval should be shortened before that
                    let intervalTimeMs = player.isTimeBelowTwelveSec() ? 20 : 200;
                    let startPoint = Date.now();

                    timeInterval = setInterval(() => {
                        const timeElapsed = Date.now() - startPoint;

                        startPoint += timeElapsed;
                        player.time -= timeElapsed;
                        player.clock.time.textContent = getTimeFromMs(player.time);

                        const isTimeEnd = player.clock.time.textContent === "0.0";

                        if (isTimeEnd) {
                            clearInterval(timeInterval);
                            player1.clock.part.classList.add("pointer-events-none");
                            player2.clock.part.classList.add("pointer-events-none");
                            disableMenuItems(3);
                        }

                        if (player.isTimeBelowTwelveSec() && intervalTimeMs !== 20) {
                            timeInterval = clearInterval(timeInterval);
                            clockStart(player);
                        }
                    }, intervalTimeMs);
                }
            } else {
                console.error(`timeStart(), wrong param: ${isObject}.`);
            }
        };

        const isGameStarting = function () {
            const isFirstActive = player1.clock.part.classList.contains(activityClass);
            const isSecondActive = player2.clock.part.classList.contains(activityClass);
            const isFirstClick = !isFirstActive && !isSecondActive;

            return isFirstClick;
        };

        const addDelay = function (player) {
            const isObject = typeof player === "object";

            if (isObject) {
                const isPlayerActive = player.clock.part.classList.contains(activityClass);

                if (!isGameStarting() && isPlayerActive) {
                    player.time += player.delay;
                    player.clock.time.textContent = getTimeFromMs(player.time);
                }
            } else {
                console.error(`addDelay(), wrong param: ${isObject}.`);
            }
        };

        const addActivityClass = function (clickedClockPart) {
            const isClockPart = Boolean(clickedClockPart?.classList?.contains("clock__part"));

            if (isClockPart) {
                const isPlayerOne = clickedClockPart === player1.clock.part;

                if (isPlayerOne) {
                    player2.clock.part.classList.add(activityClass);
                } else {
                    player1.clock.part.classList.add(activityClass);
                }
            } else {
                console.error(`addActivityClass(), wrong param: ${isClockPart}.`);
            }
        };

        const setPlayersColors = function (clickedClockPart) {
            const isClockPart = Boolean(clickedClockPart?.classList?.contains("clock__part"));

            if (isClockPart) {
                const white = "clock__info--active-white";
                const black = "clock__info--active-black";

                const isPlayerOne = clickedClockPart === player1.clock.part;

                if (isPlayerOne) {
                    player1.clock.info.classList.add(black);
                    player2.clock.info.classList.add(white);
                } else {
                    player1.clock.info.classList.add(white);
                    player2.clock.info.classList.add(black);
                }
            } else {
                console.error(`setPlayersColors(), wrong param: ${isClockPart}.`);
            }
        };

        const updateMovesInfo = function () {
            player1.clock.info.textContent = `${player1.moves} moves`;
            player2.clock.info.textContent = `${player2.moves} moves`;
        };

        const clockPartClickActions = function () {
            if (isGameStarting()) {
                audioElements.selected.play();
                disableMenuItems(1, 2, 4, 5);
                addActivityClass(this);
                setPlayersColors(this);
                updateMovesInfo();

                player1.clock.time.textContent = getTimeFromMs(player1.time);
                player2.clock.time.textContent = getTimeFromMs(player2.time);
            } else {
                const isThisActive = this.classList.contains(activityClass);

                if (isThisActive) {
                    audioElements.selected.play();
                    removeActivityClass();
                    addActivityClass(this);

                    const isPlayerOne = this === player1.clock.part;

                    if (isPlayerOne) {
                        player1.increaseMoves();
                    } else {
                        player2.increaseMoves();
                    }

                    updateMovesInfo();
                }
            }
        };

        const changeState = function () {
            const classNotClickable = "pointer-events-none";
            const isStopped = Boolean(layouts.clock.querySelector(".clock__menu .fa-pause"));

            if (isStopped) {
                timeInterval = clearInterval(timeInterval);
                player1.clock.part.classList.add(classNotClickable);
                player2.clock.part.classList.add(classNotClickable);
                disableMenuItems();
            } else {
                const isFirstActive = player1.clock.part.classList.contains(activityClass);

                if (isFirstActive) {
                    clockStart(player1);
                } else {
                    clockStart(player2);
                }

                player1.clock.part.classList.remove(classNotClickable);
                player2.clock.part.classList.remove(classNotClickable);
                disableMenuItems(1, 2, 4, 5);
            }

            changeStateIcon();
        };

        const clockOperation = function clockClickingInteractions() {
            player1.clock.part.addEventListener("click", () => {
                // order in which functions are called is important here
                // and also in the listener below
                clockStart(player2);
                addDelay(player1);
                clockPartClickActions.call(player1.clock.part);
            });

            player2.clock.part.addEventListener("click", () => {
                clockStart(player1);
                addDelay(player2);
                clockPartClickActions.call(player2.clock.part);
            });

            const stateBtn = layouts.clock.querySelector("li[data-function=state]");
            stateBtn.addEventListener("click", changeState);

            const resetBtn = layouts.clock.querySelector("li[data-function=reset]");
            resetBtn.addEventListener("click", resetClock);
        };

        return init();
    };
})();
