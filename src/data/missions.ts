import type { Mission, SeasonEvent } from "../types";
import { FiActivity, FiEdit3, FiGlobe, FiMoon, FiStar, FiSun, FiTarget, FiType, FiZap } from "react-icons/fi";
import { FaFire, FaGem, FaSnowflake, FaTrophy, FaWater } from "react-icons/fa6";
import { GiSnowman, GiSparkles, GiWatermelon } from "react-icons/gi";

// Weekly missions data
export const MISSIONS: Mission[] = [
  {
    id: "speed1",
    icon: FiZap,
    title: "Speed Demon",
    desc: "Reach 100 WPM",
    goal: 100,
    type: "wpm",
    reward: { xp: 500, badge: FiZap },
    season: "eternal",
  },
  {
    id: "speed2",
    icon: FaFire,
    title: "Blazing Fingers",
    desc: "Reach 150 WPM",
    goal: 150,
    type: "wpm",
    reward: { xp: 1000, badge: FaFire },
    season: "eternal",
  },
  {
    id: "accuracy1",
    icon: FiTarget,
    title: "Sharpshooter",
    desc: "Complete a test with 98%+ accuracy",
    goal: 98,
    type: "accuracy",
    reward: { xp: 300, badge: FiTarget },
    season: "eternal",
  },
  {
    id: "accuracy2",
    icon: FaGem,
    title: "Perfect Flow",
    desc: "Complete a test with 100% accuracy",
    goal: 100,
    type: "accuracy",
    reward: { xp: 800, badge: FaGem },
    season: "eternal",
  },
  {
    id: "tests1",
    icon: FiEdit3,
    title: "Practice Makes Perfect",
    desc: "Complete 5 tests",
    goal: 5,
    type: "tests",
    reward: { xp: 200, badge: FiEdit3 },
    season: "eternal",
  },
  {
    id: "tests2",
    icon: FiActivity,
    title: "On a Roll",
    desc: "Complete 10 tests",
    goal: 10,
    type: "tests",
    reward: { xp: 400, badge: FiActivity },
    season: "eternal",
  },
  {
    id: "tests3",
    icon: FaTrophy,
    title: "Typing Machine",
    desc: "Complete 25 tests",
    goal: 25,
    type: "tests",
    reward: { xp: 1000, badge: FaTrophy },
    season: "eternal",
  },
  {
    id: "combo1",
    icon: FaFire,
    title: "On Fire",
    desc: "Get a 10x combo streak",
    goal: 10,
    type: "combo",
    reward: { xp: 300, badge: FaFire },
    season: "eternal",
  },
  {
    id: "combo2",
    icon: GiSparkles,
    title: "Unstoppable",
    desc: "Get a 20x combo streak",
    goal: 20,
    type: "combo",
    reward: { xp: 600, badge: GiSparkles },
    season: "eternal",
  },
  {
    id: "languages",
    icon: FiGlobe,
    title: "Polyglot",
    desc: "Practice in 3 different languages",
    goal: 3,
    type: "langs",
    reward: { xp: 500, badge: FiGlobe },
    season: "eternal",
  },
  {
    id: "daily1",
    icon: FiSun,
    title: "Daily Player",
    desc: "Log in for 3 consecutive days",
    goal: 3,
    type: "streak",
    reward: { xp: 300, badge: FiSun },
    season: "eternal",
  },
  {
    id: "daily2",
    icon: FiStar,
    title: "Week Warrior",
    desc: "Log in for 7 consecutive days",
    goal: 7,
    type: "streak",
    reward: { xp: 1000, badge: FiStar },
    season: "eternal",
  },
];

// Seasonal events
export const SEASONS: SeasonEvent[] = [
  {
    id: "summer2025",
    name: "Summer Rush",
    desc: "Beat the heat with blazing fast typing!",
    start: "2025-06-01",
    end: "2025-08-31",
    missions: [
      {
        id: "summer_speed",
        icon: FaWater,
        title: "Summer Speed",
        desc: "Reach 120 WPM in summer mode",
        goal: 120,
        type: "wpm",
        reward: { xp: 1500, badge: FaWater },
      },
      {
        id: "summer_tests",
        icon: GiWatermelon,
        title: "Summer Practice",
        desc: "Complete 20 summer tests",
        goal: 20,
        type: "tests",
        reward: { xp: 2000, badge: GiWatermelon },
      },
    ],
    isActive: () => {
      const now = new Date();
      return now >= new Date("2025-06-01") && now <= new Date("2025-08-31");
    },
  },
  {
    id: "winter2025",
    name: "Winter Frost",
    desc: "Cold fingers? Warm them up with typing!",
    start: "2025-12-01",
    end: "2026-02-28",
    missions: [
      {
        id: "winter_accuracy",
        icon: GiSnowman,
        title: "Frost Precision",
        desc: "98%+ accuracy in winter mode",
        goal: 98,
        type: "accuracy",
        reward: { xp: 1500, badge: GiSnowman },
      },
      {
        id: "winter_combo",
        icon: FaSnowflake,
        title: "Ice Cold Combo",
        desc: "Get 15x combo streak",
        goal: 15,
        type: "combo",
        reward: { xp: 2000, badge: FaSnowflake },
      },
    ],
    isActive: () => {
      const now = new Date();
      return now >= new Date("2025-12-01") && now <= new Date("2026-02-28");
    },
  },
  {
    id: "ramadan2026",
    name: "Ramadan Mubarak",
    desc: "Blessed month of speed and precision!",
    start: "2026-02-17",
    end: "2026-03-19",
    missions: [
      {
        id: "ramadan_night",
        icon: FiMoon,
        title: "Night Typer",
        desc: "Practice after Iftar (evening hours)",
        goal: 10,
        type: "tests",
        reward: { xp: 1500, badge: FiMoon },
      },
      {
        id: "ramadan_uz",
        icon: FiType,
        title: "O'zbekcha Yoz",
        desc: "Type 5 tests in Uzbek",
        goal: 5,
        type: "tests_uz",
        reward: { xp: 2000, badge: FiType },
      },
    ],
    isActive: () => {
      const now = new Date();
      return now >= new Date("2026-02-17") && now <= new Date("2026-03-19");
    },
  },
];
