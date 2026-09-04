/**
 * Seed data for the Open Robot Index.
 *
 * Same shape as the DATA array in the original open-robot-index.html:
 *   sdk → robots.sdk_access, priceNote → first robot_tiers row, src → sources row,
 *   conf → robots.confidence, notes → robots.summary.
 *
 * Every row is last_checked 2026-09-03. `scripts/seed.ts` upserts this into
 * Supabase; `src/lib/data.ts` serves it directly when Supabase is not configured.
 *
 * Prices are USD as read on the cited page on the check date. Quote-only tiers
 * have price: null and say so. Never invent a price.
 */

import type {
  Confidence,
  LerobotSupport,
  OpenHardware,
  RobotForm,
  SdkAccess,
} from "@/lib/types";

export const LAST_CHECKED = "2026-09-03";

export interface SeedCompany {
  slug: string;
  name: string;
  country: string | null;
  website: string | null;
  description: string | null;
}

export interface SeedSource {
  url: string;
  title: string;
  publisher: string;
  /** Under 15 words. */
  quote?: string;
  /** Which field this source supports (shown on the robot page). */
  field?: string;
}

export interface SeedTier {
  name: string;
  price: number | null;
  note?: string;
  currencyNote?: string;
  includesSdk: boolean;
  compute?: string;
}

export interface SeedRobot {
  slug: string;
  name: string;
  company: string; // company slug
  form: RobotForm;
  notes: string; // → summary
  sdk: SdkAccess;
  sdkNote: string;
  languages: string[];
  accessLevel?: string;
  openHardware: OpenHardware;
  openHardwareNote?: string;
  lerobot: LerobotSupport;
  sim?: string;
  availability: string;
  conf: Confidence;
  confNote?: string;
  priceNote: string; // → first tier's price_note when tiers[0] has none
  tiers: SeedTier[];
  src: SeedSource; // primary source (price where one exists)
  extraSources?: SeedSource[];
  dof?: number;
  payloadKg?: number;
  heightCm?: number;
  weightKg?: number;
}

export const COMPANIES: SeedCompany[] = [
  { slug: "the-robot-studio", name: "The Robot Studio", country: "France", website: "https://github.com/TheRobotStudio", description: "Open-source arm designs (SO-100 / SO-101) built with Hugging Face for the LeRobot ecosystem." },
  { slug: "koch-open-source", name: "Koch v1.1 (open-source project)", country: null, website: "https://github.com/jess-moss/koch-v1-1", description: "Community low-cost leader/follower arm, the original LeRobot reference hardware. Kits sold by ROBOTIS." },
  { slug: "sigrobotics-uiuc", name: "SIGRobotics UIUC", country: "United States", website: "https://github.com/SIGRobotics-UIUC", description: "Student robotics group at the University of Illinois; maintains LeKiwi." },
  { slug: "xlerobot", name: "XLeRobot (open-source project)", country: null, website: "https://xlerobot.readthedocs.io", description: "Open-source dual-arm mobile household robot built from SO-101 arms and a LeKiwi base." },
  { slug: "hugging-face", name: "Hugging Face", country: "United States", website: "https://huggingface.co", description: "Maintains LeRobot and co-develops open hardware such as HopeJR and Reachy Mini." },
  { slug: "pollen-robotics", name: "Pollen Robotics", country: "France", website: "https://www.pollen-robotics.com", description: "Open-source humanoid robotics; acquired by Hugging Face in 2025." },
  { slug: "unitree", name: "Unitree Robotics", country: "China", website: "https://www.unitree.com", description: "Quadrupeds and humanoids at consumer and research price points." },
  { slug: "hello-robot", name: "Hello Robot", country: "United States", website: "https://hello-robot.com", description: "Makers of the Stretch mobile manipulator with an open Python and ROS 2 stack." },
  { slug: "clearpath-robotics", name: "Clearpath Robotics", country: "Canada", website: "https://clearpathrobotics.com", description: "Research mobile platforms; builds the TurtleBot 4 on the iRobot Create 3." },
  { slug: "elephant-robotics", name: "Elephant Robotics", country: "China", website: "https://www.elephantrobotics.com", description: "Low-cost desktop cobots (myCobot) with open Python SDKs." },
  { slug: "ufactory", name: "UFACTORY", country: "China", website: "https://www.ufactory.cc", description: "Desktop and light industrial arms (Lite 6, xArm) with Python, C++ and ROS SDKs." },
  { slug: "agilex-robotics", name: "AgileX Robotics", country: "China", website: "https://global.agilex.ai", description: "Mobile bases and the PiPER lightweight arm used in many imitation-learning rigs." },
  { slug: "trossen-robotics", name: "Trossen Robotics", country: "United States", website: "https://www.trossenrobotics.com", description: "Research arms and ALOHA-style teleoperation kits." },
  { slug: "deep-robotics", name: "DEEP Robotics", country: "China", website: "https://www.deeprobotics.cn/en", description: "Quadrupeds for research and industry, including the Lite3." },
  { slug: "waveshare", name: "Waveshare", country: "China", website: "https://www.waveshare.com", description: "Electronics maker; sells the low-cost RoArm desktop arms." },
  { slug: "annin-robotics", name: "Annin Robotics", country: "United States", website: "https://www.anninrobotics.com", description: "Open-source six-axis AR4 arm sold as kits or plans." },
  { slug: "dobot", name: "Dobot", country: "China", website: "https://www.dobot-robots.com", description: "Educational and light industrial arms." },
  { slug: "robotis", name: "ROBOTIS", country: "South Korea", website: "https://www.robotis.com", description: "Maker of DYNAMIXEL servos and the open-source OpenMANIPULATOR and TurtleBot 3 platforms." },
  { slug: "berkeley-hybrid-robotics", name: "UC Berkeley Hybrid Robotics", country: "United States", website: "https://lite.berkeley-humanoid.org", description: "Research lab behind the open-source Berkeley Humanoid Lite." },
  { slug: "enactic", name: "Enactic", country: "Japan", website: "https://openarm.dev", description: "Maintains OpenArm, an open-source bimanual arm for teleoperation and learning." },
  { slug: "mangdang", name: "MangDang", country: "China", website: "https://www.mangdang.store", description: "Makers of the Mini Pupper open-source ROS 2 quadruped." },
];

export const DATA: SeedRobot[] = [
  {
    slug: "so-101",
    name: "SO-101",
    company: "the-robot-studio",
    form: "arm",
    notes:
      "The default entry point into LeRobot. A 3D-printed, five-joint arm driven by Feetech STS3215 servos that you build yourself or buy as a kit from several vendors. Usually bought as a leader and follower pair for teleoperation and imitation learning.",
    sdk: "full",
    sdkNote: "Everything is open. Control is through LeRobot's Python API or the Feetech servo protocol directly; there is no vendor tier.",
    languages: ["Python"],
    accessLevel: "Direct servo bus access, no firmware lock",
    openHardware: "yes",
    openHardwareNote: "CAD, BOM and print files published under Apache 2.0.",
    lerobot: "native",
    sim: "MuJoCo and Isaac models maintained by the community",
    availability: "In stock as kits from Seeed, WowRobo and Partabot; parts also sold separately",
    conf: "medium",
    confNote: "The repo lists vendors but no prices. Seeed's kit price is used here; other vendors and self-sourced BOMs (reported at $100 to $130 per arm) differ.",
    priceNote: "Seeed SO-ARM101 Pro kit: servos, boards and hardware for one arm, no printed parts",
    tiers: [
      { name: "SO-ARM101 Pro kit (Seeed)", price: 277.99, note: "Servos, boards and hardware; printed parts are a $29.90 add-on.", includesSdk: true },
      { name: "Printed parts add-on (Seeed)", price: 29.9, includesSdk: true },
    ],
    src: { url: "https://www.seeedstudio.com/SO-ARM101-Low-Cost-AI-Arm-Kit-Pro-p-6427.html", title: "SO-ARM101 Low-Cost AI Arm Kit Pro", publisher: "Seeed Studio", quote: "$277.99, in stock", field: "price" },
    extraSources: [
      { url: "https://github.com/TheRobotStudio/SO-ARM100", title: "SO-ARM100 / SO-101 repository", publisher: "The Robot Studio", field: "open_hardware" },
      { url: "https://huggingface.co/docs/lerobot/so101", title: "SO-101 in LeRobot docs", publisher: "Hugging Face", field: "lerobot_support" },
    ],
    dof: 5,
    weightKg: 0.8,
  },
  {
    slug: "koch-v1-1",
    name: "Koch v1.1",
    company: "koch-open-source",
    form: "arm",
    notes:
      "The arm that LeRobot was originally built around, using DYNAMIXEL servos. Fully open and still supported in the current LeRobot release, with ROBOTIS selling ready kits. Superseded in popularity by the SO-101, which is cheaper to build.",
    sdk: "full",
    sdkNote: "Open design with direct DYNAMIXEL bus control through LeRobot. No tiers.",
    languages: ["Python"],
    openHardware: "yes",
    openHardwareNote: "STL files and BOM in the repo under Apache 2.0.",
    lerobot: "native",
    sim: "None official",
    availability: "In stock as kits from ROBOTIS; self-build from the repo BOM",
    conf: "medium",
    confNote: "Follower kit price read on ROBOTIS' store; the leader arm is sold separately and its price was not confirmed on the same visit.",
    priceNote: "ROBOTIS follower arm kit",
    tiers: [
      { name: "Follower arm kit (ROBOTIS)", price: 212.92, includesSdk: true },
      { name: "Leader arm kit (ROBOTIS)", price: null, note: "Sold separately, reported around $199; confirm.", includesSdk: true },
    ],
    src: { url: "https://www.robotis.us/koch-v1-1-low-cost-robot-arm-follower/", title: "Koch v1.1 Low Cost Robot Arm Follower", publisher: "ROBOTIS", quote: "$212.92, in stock", field: "price" },
    extraSources: [
      { url: "https://github.com/jess-moss/koch-v1-1", title: "Koch v1.1 repository", publisher: "GitHub", field: "open_hardware" },
    ],
    dof: 5,
  },
  {
    slug: "lekiwi",
    name: "LeKiwi",
    company: "sigrobotics-uiuc",
    form: "mobile_manipulator",
    notes:
      "A three-wheeled omnidirectional base with an SO-101 arm on top, run from a Raspberry Pi 5. The cheapest way to collect mobile-manipulation data for LeRobot. Sold as kits by the same vendors that sell SO-101.",
    sdk: "full",
    sdkNote: "Open design; the base and arm are driven from LeRobot over the Pi's USB. No tiers.",
    languages: ["Python"],
    openHardware: "yes",
    openHardwareNote: "CAD and BOM in the repo.",
    lerobot: "native",
    sim: "None official",
    availability: "Self-build from the BOM; kits from Seeed and ROBOTIS",
    conf: "high",
    confNote: "BOM totals are from the official repo and vary by region and vendor.",
    priceNote: "Full 12 V build BOM including one SO-101 arm and Pi 5",
    tiers: [
      { name: "Full build, 12 V (BOM)", price: 482, note: "5 V version $499.", includesSdk: true, compute: "Raspberry Pi 5" },
      { name: "Base only, wired (BOM)", price: 184, note: "No arm.", includesSdk: true, compute: "Raspberry Pi 5" },
    ],
    src: { url: "https://github.com/SIGRobotics-UIUC/LeKiwi/blob/main/BOM.md", title: "LeKiwi BOM", publisher: "SIGRobotics UIUC", quote: "12V version: $482; base only wired: $184", field: "price" },
    extraSources: [
      { url: "https://huggingface.co/docs/lerobot/lekiwi", title: "LeKiwi in LeRobot docs", publisher: "Hugging Face", field: "lerobot_support" },
    ],
    dof: 5,
  },
  {
    slug: "xlerobot",
    name: "XLeRobot",
    company: "xlerobot",
    form: "mobile_manipulator",
    notes:
      "Two SO-101 arms on a LeKiwi-style base mounted to an IKEA cart, giving a dual-arm household robot for well under $1,000. Popular as a research and hobby platform; every part is open and off the shelf. DIY only; the project sells no kit.",
    sdk: "full",
    sdkNote: "Open project built on LeRobot components with its own control code. No vendor, no tiers.",
    languages: ["Python"],
    openHardware: "yes",
    openHardwareNote: "Full build guide, CAD and BOM published.",
    lerobot: "community",
    sim: "MuJoCo and ManiSkill scenes in the repo",
    availability: "Self-build only; parts are in stock from LeRobot vendors",
    conf: "high",
    confNote: "BOM from the official docs; excludes 3D printing and optional parts.",
    priceNote: "Basic build BOM, two arms and base, excluding printing",
    tiers: [
      { name: "Basic build (BOM)", price: 660, note: "Raspberry Pi adds $79; RealSense head camera adds $220.", includesSdk: true, compute: "Raspberry Pi 5" },
    ],
    src: { url: "https://xlerobot.readthedocs.io/en/latest/hardware/getting_started/material.html", title: "XLeRobot materials list", publisher: "XLeRobot docs", quote: "~$660, RaspberryPi +$79", field: "price" },
    extraSources: [
      { url: "https://github.com/Vector-Wangel/XLeRobot", title: "XLeRobot repository", publisher: "GitHub", field: "open_hardware" },
    ],
    dof: 10,
  },
  {
    slug: "hopejr",
    name: "HopeJR",
    company: "hugging-face",
    form: "humanoid",
    notes:
      "An open-source humanoid upper body from Hugging Face and The Robot Studio: two arms with dexterous hands and a torso, teleoperated with exoskeleton gloves. Announced at roughly $3,000; as of this check no store lists a firm price.",
    sdk: "full",
    sdkNote: "Open hardware controlled through LeRobot. No tiers.",
    languages: ["Python"],
    openHardware: "yes",
    openHardwareNote: "Design files in the HopeJR repo.",
    lerobot: "native",
    sim: "None official",
    availability: "Waitlist; no kit vendor with a firm price found",
    conf: "verify",
    confNote: "$3,000 is the May 2025 announced estimate. No official store listing or kit vendor with a firm price was found on the check date.",
    priceNote: "Announced target price for the full kit",
    tiers: [
      { name: "Full kit (announced target)", price: 3000, note: "Announced estimate; not a store price.", includesSdk: true },
    ],
    src: { url: "https://huggingface.co/posts/clem/522668354429256", title: "HopeJR announcement post", publisher: "Hugging Face", quote: "HopeJR for $3,000", field: "price" },
    extraSources: [
      { url: "https://github.com/TheRobotStudio/HopeJR", title: "HopeJR repository", publisher: "The Robot Studio", field: "open_hardware" },
    ],
    dof: 32,
  },
  {
    slug: "reachy-mini",
    name: "Reachy Mini",
    company: "pollen-robotics",
    form: "desktop",
    notes:
      "A desktop expressive robot with a moving head, antennas, camera and microphones, meant for testing conversational and vision models. Fully programmable in Python out of the box; hardware and software are open source.",
    sdk: "full",
    sdkNote: "Python SDK ships with both models. The Lite needs a connected computer; the wireless model runs on an onboard Raspberry Pi.",
    languages: ["Python"],
    accessLevel: "Full motor, camera and audio access from the SDK",
    openHardware: "yes",
    openHardwareNote: "Hardware and software published as open source by Pollen and Hugging Face.",
    lerobot: "supported",
    sim: "Simulation mode in the SDK",
    availability: "Preorder from Pollen's store; lead time up to 90 days on the check date",
    conf: "high",
    priceNote: "Lite model, requires a host computer; excludes tax and shipping",
    tiers: [
      { name: "Reachy Mini Lite", price: 399, note: "Tethered to a computer. Plus tax and shipping.", currencyNote: "€350 on the EU store", includesSdk: true, compute: "Host PC" },
      { name: "Reachy Mini Wireless", price: 499, note: "Onboard Raspberry Pi 5, battery, Wi-Fi. Plus tax and shipping.", currencyNote: "€435 on the EU store", includesSdk: true, compute: "Raspberry Pi 5" },
    ],
    src: { url: "https://huggingface.co/blog/reachy-mini", title: "Reachy Mini announcement", publisher: "Hugging Face", quote: "$399 (+ taxes + shipping) ... $499", field: "price" },
    extraSources: [
      { url: "https://pollen-robotics.com/reachy-mini/", title: "Reachy Mini product page", publisher: "Pollen Robotics", field: "sdk_access" },
    ],
    dof: 9,
    heightCm: 28,
    weightKg: 1.5,
  },
  {
    slug: "unitree-go2",
    name: "Unitree Go2",
    company: "unitree",
    form: "quadruped",
    notes:
      "The most common quadruped under $5K. The Air and Pro are consumer models controlled from an app; the SDK that lets you write your own controllers is officially supported only on the EDU tier, which costs several times more. Buy the EDU if you want to program it properly.",
    sdk: "gated",
    sdkNote: "unitree_sdk2 (C++ and Python) secondary development is officially supported only on the EDU tier. Air and Pro expose the app and a limited high-level interface that the community reverse-engineered over WebRTC.",
    languages: ["C++", "Python"],
    accessLevel: "EDU: low-level joint control, ROS 2 packages. Air/Pro: app and undocumented high-level API only.",
    openHardware: "no",
    lerobot: "none",
    sim: "unitree_mujoco and Isaac Lab assets published by Unitree",
    availability: "Backorder on Unitree's store, shipping within about a month; EDU quoted through sales",
    conf: "high",
    confNote: "Air and Pro prices are on the official store. EDU is quote-only; resellers cite roughly $11K to $15.6K.",
    priceNote: "Air model without controller, no SDK",
    tiers: [
      { name: "Go2 Air", price: 1600, note: "Without controller. App control only.", includesSdk: false },
      { name: "Go2 Pro", price: 2800, note: "Adds lidar and more compute; still no SDK license.", includesSdk: false },
      { name: "Go2 EDU", price: null, note: "Quote only. Resellers cite $11K to $15.6K. Includes the SDK and Jetson compute options.", includesSdk: true, compute: "Jetson Orin options" },
    ],
    src: { url: "https://shop.unitree.com/products/unitree-go2", title: "Unitree Go2 store page", publisher: "Unitree", quote: "Go2 Air (without controller) $1,600.00", field: "price" },
    extraSources: [
      { url: "https://github.com/unitreerobotics/unitree_sdk2", title: "unitree_sdk2", publisher: "Unitree", field: "sdk_access" },
    ],
    dof: 12,
    payloadKg: 8,
    heightCm: 40,
    weightKg: 15,
  },
  {
    slug: "unitree-g1",
    name: "Unitree G1",
    company: "unitree",
    form: "humanoid",
    notes:
      "A 1.3 m humanoid at a price that undercuts everything else in its class. The standard model is a demonstrator that Unitree says does not support secondary development; the EDU editions, which unlock the SDK, hands and more joints, sit above this index's price ceiling. Listed because buyers ask exactly what the standard model gets you.",
    sdk: "gated",
    sdkNote: "The standard G1 does not support secondary development. unitree_sdk2 and ROS 2 support come with the G1 EDU, which is quote-only and priced well above $25K.",
    languages: ["C++", "Python"],
    accessLevel: "Standard: none. EDU: joint-level control, ROS 2, optional dexterous hands.",
    openHardware: "no",
    lerobot: "community",
    sim: "MuJoCo and Isaac Lab models published by Unitree",
    availability: "Backordered on Unitree's store; EDU quoted",
    conf: "high",
    confNote: "Standard price is on the official store. EDU is quote-only; resellers cite $43.5K to $73.9K.",
    priceNote: "Standard model, no SDK",
    tiers: [
      { name: "G1 (standard)", price: 13500, note: "23 DoF, no secondary development.", includesSdk: false },
      { name: "G1 EDU", price: null, note: "Quote only and far above the $25K ceiling; includes SDK.", includesSdk: true, compute: "Jetson Orin NX" },
    ],
    src: { url: "https://shop.unitree.com/products/unitree-g1", title: "Unitree G1 store page", publisher: "Unitree", quote: "$13,500.00; for customization needs select the EDU edition", field: "price" },
    dof: 23,
    payloadKg: 2,
    heightCm: 127,
    weightKg: 35,
  },
  {
    slug: "stretch-3",
    name: "Stretch 3",
    company: "hello-robot",
    form: "mobile_manipulator",
    notes:
      "A tall, thin mobile manipulator built for homes and labs, with a telescoping arm and a well-documented Python and ROS 2 stack. The most programmable turnkey mobile manipulator under $25K. Its successor, Stretch 4, launched in May 2026 at $29,950 and is above this index's ceiling.",
    sdk: "full",
    sdkNote: "Stretch Body (Python) and stretch_ros2 ship with every unit under an open license. One tier.",
    languages: ["Python", "ROS 2"],
    accessLevel: "Joint-level control, all sensors, onboard compute",
    openHardware: "partial",
    openHardwareNote: "Software is open source; mechanical design is not, though many tool attachments are published for 3D printing.",
    lerobot: "native",
    sim: "stretch_mujoco published by Hello Robot",
    availability: "Available from Hello Robot; the main purchase page now leads with Stretch 4",
    conf: "high",
    confNote: "Price is on the Stretch 3 site. Confirm it remains orderable now that Stretch 4 has launched.",
    priceNote: "Single tier, SDK included",
    tiers: [
      { name: "Stretch 3", price: 24950, includesSdk: true, compute: "Intel NUC onboard" },
    ],
    src: { url: "https://hello-stretch3.com/", title: "Stretch 3", publisher: "Hello Robot", quote: "Available Now for $24,950", field: "price" },
    extraSources: [
      { url: "https://github.com/hello-robot/stretch_body", title: "stretch_body", publisher: "Hello Robot", field: "sdk_access" },
    ],
    payloadKg: 2,
    heightCm: 140,
    weightKg: 24.5,
  },
  {
    slug: "turtlebot-4",
    name: "TurtleBot 4",
    company: "clearpath-robotics",
    form: "mobile_base",
    notes:
      "The official ROS 2 reference platform: an iRobot Create 3 base with a Raspberry Pi 4, lidar and camera. Everything is meant to be programmed; nothing is locked. The Lite drops the OAK-D Pro camera, display and top shell.",
    sdk: "full",
    sdkNote: "ROS 2 packages are open source and included with both models. No SDK tier.",
    languages: ["Python", "C++", "ROS 2"],
    openHardware: "partial",
    openHardwareNote: "Clearpath's mounting hardware and software are open; the Create 3 base is closed.",
    lerobot: "none",
    sim: "Gazebo simulation packages maintained by Clearpath",
    availability: "Sold through distributors; Clearpath's page has no price and routes to a quote form",
    conf: "verify",
    confNote: "The USD figures are the 2022 launch MSRP. Clearpath's page no longer lists a price and distributor prices differ (one EU distributor lists the Lite at €1,699 incl. VAT).",
    priceNote: "Lite model, 2022 launch MSRP",
    tiers: [
      { name: "TurtleBot 4 Lite", price: 1195, note: "2022 launch MSRP; confirm with a distributor.", includesSdk: true, compute: "Raspberry Pi 4" },
      { name: "TurtleBot 4 Standard", price: 1850, note: "Adds OAK-D Pro camera, shell and display. 2022 launch MSRP.", includesSdk: true, compute: "Raspberry Pi 4" },
    ],
    src: { url: "https://clearpathrobotics.com/turtlebot-4/", title: "TurtleBot 4 product page", publisher: "Clearpath Robotics", field: "sdk_access" },
    extraSources: [
      { url: "https://www.hackster.io/news/clearpath-robotics-launches-the-turtlebot-4-offering-an-affordable-autonomous-ros-2-robot-platform-6bc3d6a10cbd", title: "Clearpath launches the TurtleBot 4", publisher: "Hackster", quote: "Lite is USD $1,195, Standard is USD $1,850", field: "price" },
    ],
    payloadKg: 9,
    weightKg: 3.9,
  },
  {
    slug: "mycobot-280",
    name: "myCobot 280",
    company: "elephant-robotics",
    form: "arm",
    notes:
      "A six-axis desktop arm with a 250 g payload, sold with a choice of controller (M5Stack, Raspberry Pi, Jetson). Cheap enough for classrooms and fully scriptable from Python. Not precise or strong enough for real manipulation work.",
    sdk: "full",
    sdkNote: "pymycobot (Python), C++, C# and ROS packages are free for every variant.",
    languages: ["Python", "C++", "C#", "ROS"],
    openHardware: "partial",
    openHardwareNote: "SDK and some 3D files are open; the arm itself is closed.",
    lerobot: "community",
    sim: "ROS and MoveIt configs published",
    availability: "In stock; ships in 7 to 15 business days",
    conf: "high",
    confNote: "M5Stack price is on the official store. The Jetson Nano variant price came from a secondary listing of the official page.",
    priceNote: "M5Stack variant",
    tiers: [
      { name: "myCobot 280 M5", price: 649, includesSdk: true, compute: "M5Stack ESP32" },
      { name: "myCobot 280 Jetson Nano", price: 849, note: "Confirm on the store; read from a secondary listing.", includesSdk: true, compute: "Jetson Nano" },
    ],
    src: { url: "https://shop.elephantrobotics.com/products/mycobot-worlds-smallest-and-lightest-six-axis-collaborative-robot", title: "myCobot 280 store page", publisher: "Elephant Robotics", quote: "Regular price $649.00, ships in 7-15 business days", field: "price" },
    dof: 6,
    payloadKg: 0.25,
    weightKg: 0.85,
  },
  {
    slug: "ufactory-lite-6",
    name: "UFACTORY Lite 6",
    company: "ufactory",
    form: "arm",
    notes:
      "A small industrial-grade six-axis arm with a 600 g payload and a proper controller box. Considerably more rigid and repeatable than hobby arms, with the same SDK as the larger xArm line.",
    sdk: "full",
    sdkNote: "xArm Python, C++ and C# SDKs and ROS 1/2 packages are open source and work with every unit. Single tier; grippers are extras.",
    languages: ["Python", "C++", "C#", "ROS"],
    openHardware: "no",
    lerobot: "community",
    sim: "ROS and MoveIt configs; Isaac Sim assets from the community",
    availability: "Out of stock on UFACTORY's US store on the check date; resellers list it",
    conf: "high",
    confNote: "Official US store price. Resellers range from $2,999 to $4,186.",
    priceNote: "Arm and controller, no gripper",
    tiers: [
      { name: "Lite 6", price: 3500, includesSdk: true, compute: "Controller box" },
    ],
    src: { url: "https://www.ufactory.us/product/lite-6", title: "Lite 6 product page", publisher: "UFACTORY", quote: "$3,500.00 USD; this product is out of stock", field: "price" },
    extraSources: [
      { url: "https://github.com/xArm-Developer/xArm-Python-SDK", title: "xArm-Python-SDK", publisher: "UFACTORY", field: "sdk_access" },
    ],
    dof: 6,
    payloadKg: 0.6,
    weightKg: 4.5,
  },
  {
    slug: "agilex-piper",
    name: "AgileX PiPER",
    company: "agilex-robotics",
    form: "arm",
    notes:
      "A 1.5 kg payload six-axis arm that became the workhorse of low-cost imitation-learning rigs. Controlled over CAN with an open Python SDK; commonly bought in pairs for bimanual setups.",
    sdk: "full",
    sdkNote: "piper_sdk (Python, CAN) and ROS packages are open source on GitHub for every buyer. Teleop kits with a leader arm are sold as bundles.",
    languages: ["Python", "C++", "ROS"],
    accessLevel: "Joint and end-effector control over CAN",
    openHardware: "no",
    lerobot: "community",
    sim: "URDF and MoveIt configs published",
    availability: "In stock on AgileX's global store",
    conf: "high",
    confNote: "Official global store price. US resellers list $2,499 to $3,999.",
    priceNote: "Single arm on the AgileX global store",
    tiers: [
      { name: "PiPER", price: 1999, includesSdk: true },
    ],
    src: { url: "https://global.agilex.ai/products/piper", title: "PiPER product page", publisher: "AgileX Robotics", quote: "Regular price $1,999.00", field: "price" },
    extraSources: [
      { url: "https://github.com/agilexrobotics/piper_sdk", title: "piper_sdk", publisher: "AgileX Robotics", field: "sdk_access" },
    ],
    dof: 6,
    payloadKg: 1.5,
    weightKg: 4.2,
  },
  {
    slug: "trossen-widowx-ai",
    name: "Trossen WidowX AI",
    company: "trossen-robotics",
    form: "arm",
    notes:
      "Trossen's research arm rebuilt for learning workloads, with an open C++ and Python driver and a LeRobot plugin. The Base is the arm alone; the full kit adds leader and follower arms and cameras. The single-arm sibling of the ALOHA kits, which sit above this index's ceiling.",
    sdk: "full",
    sdkNote: "The trossen_arm driver (C++ with Python bindings) and the LeRobot plugin are open source and included. No SDK tier.",
    languages: ["Python", "C++"],
    openHardware: "no",
    lerobot: "supported",
    sim: "MuJoCo and Isaac assets published by Trossen",
    availability: "Sold out on Trossen's store on the check date",
    conf: "high",
    confNote: "Prices are on the official store, which showed variants sold out at the time.",
    priceNote: "Base: arm only, no cameras",
    tiers: [
      { name: "WidowX AI Base", price: 2995, note: "Arm only, no cameras.", includesSdk: true },
      { name: "WidowX AI (leader + follower)", price: 4545.95, note: "Full teleop kit with cameras.", includesSdk: true },
    ],
    src: { url: "https://store.trossenrobotics.com/products/widowx-ai", title: "WidowX AI store page", publisher: "Trossen Robotics", quote: "Regular price $4,545.95 USD", field: "price" },
    dof: 6,
    payloadKg: 1.5,
  },
  {
    slug: "deep-robotics-lite3",
    name: "DEEP Robotics Lite3",
    company: "deep-robotics",
    form: "quadruped",
    notes:
      "A 12 kg research quadruped that competes with the Go2. The Basic edition is remote-controlled; the motion SDK, ROS support and an onboard computer come with the Venture, Pro and LiDAR editions, which are quoted.",
    sdk: "gated",
    sdkNote: "The Basic edition is remote-control only. The motion SDK and onboard compute come with the Venture, Pro and LiDAR editions.",
    languages: ["C++", "Python", "ROS"],
    openHardware: "no",
    lerobot: "none",
    sim: "Gazebo packages for SDK-tier users",
    availability: "Basic sold out on the US store on the check date; higher editions through sales",
    conf: "medium",
    confNote: "Basic price is on the official US store. Venture and Pro prices are only reported by secondary sources (about $9,500 and $12,999).",
    priceNote: "Basic edition, remote control only",
    tiers: [
      { name: "Lite3 Basic", price: 2890, note: "No SDK.", includesSdk: false },
      { name: "Lite3 Venture", price: null, note: "Quote; secondary sources cite about $9,500. Includes SDK and compute.", includesSdk: true, compute: "Onboard computer" },
      { name: "Lite3 Pro", price: null, note: "Quote; secondary sources cite about $12,999.", includesSdk: true, compute: "Onboard computer" },
    ],
    src: { url: "https://shop.deeprobotics.us/products/lite-3", title: "Lite3 US store page", publisher: "DEEP Robotics", quote: "$2,890.00, sold out, please contact our sales team", field: "price" },
    dof: 12,
    payloadKg: 5,
    weightKg: 12,
  },
  {
    slug: "waveshare-roarm-m3",
    name: "Waveshare RoArm-M3",
    company: "waveshare",
    form: "arm",
    notes:
      "A sub-$300 desktop arm on an ESP32 that accepts JSON commands over USB, Wi-Fi or serial. Weak and imprecise, but every command is documented and the firmware is open, so it is a genuine programming target rather than a toy.",
    sdk: "full",
    sdkNote: "JSON command protocol, Python examples and ROS 2 packages are published; ESP32 firmware source is on GitHub. No tiers.",
    languages: ["Python", "C++ (Arduino/ESP32)", "ROS 2"],
    openHardware: "partial",
    openHardwareNote: "Firmware and control code are open; mechanical files are only partly published.",
    lerobot: "compatible",
    sim: "None official",
    availability: "In stock from Waveshare and distributors",
    conf: "verify",
    confNote: "Waveshare's site blocked automated checks, so the USD range comes from press coverage. An EU distributor lists €309 (S) and €419 (Pro).",
    priceNote: "RoArm-M3-S base model",
    tiers: [
      { name: "RoArm-M3-S", price: 179.99, note: "From press coverage; confirm on waveshare.com.", includesSdk: true, compute: "ESP32" },
      { name: "RoArm-M3-Pro", price: 299.99, note: "Metal-shell servos. From press coverage; confirm.", includesSdk: true, compute: "ESP32" },
    ],
    src: { url: "https://www.waveshare.com/roarm-m3.htm", title: "RoArm-M3 product page", publisher: "Waveshare", field: "sdk_access" },
    extraSources: [
      { url: "https://www.cnx-software.com/2025/02/17/waveshare-esp32-robotic-arm-kit-with-51-dof-supports-ros2-lerobot-and-jetson-orin-nx-integration/", title: "Waveshare ESP32 robotic arm kit", publisher: "CNX Software", quote: "priced between $179.99 - $299.99", field: "price" },
    ],
    dof: 5,
    payloadKg: 0.2,
  },
  {
    slug: "annin-ar4-mk5",
    name: "Annin Robotics AR4 MK5",
    company: "annin-robotics",
    form: "arm",
    notes:
      "An open-source six-axis arm with stepper motors and a real reach, sold as a combo kit with the motors sourced separately, or built from published plans. Popular with makers who want an industrial-shaped arm without an industrial price. Expect assembly time.",
    sdk: "full",
    sdkNote: "Control software is open-source Python with open Teensy firmware; community ROS 2 and MoveIt packages exist. Plans are free, so there is no tier.",
    languages: ["Python", "C++ (Teensy)", "ROS 2 (community)"],
    openHardware: "yes",
    openHardwareNote: "CAD, BOM and control software published free of charge.",
    lerobot: "none",
    sim: "Community URDF and MoveIt configs",
    availability: "Combo kit in stock; plans always available",
    conf: "high",
    confNote: "Kit price is on the official store. Motors are bought separately from StepperOnline for roughly $750, so a complete build is about $2,000.",
    priceNote: "Combo kit, motors not included",
    tiers: [
      { name: "AR4 MK5 combo kit", price: 1189, note: "Starting price; motors about $750 extra.", includesSdk: true },
    ],
    src: { url: "https://anninrobotics.com/product-page/ar4-mk5-robot-combo-kit/", title: "AR4 MK5 Robot Combo Kit", publisher: "Annin Robotics", quote: "From $1,189.00, in stock", field: "price" },
    dof: 6,
    payloadKg: 2,
    weightKg: 11,
  },
  {
    slug: "dobot-magician",
    name: "Dobot Magician",
    company: "dobot",
    form: "arm",
    notes:
      "A four-axis educational arm with interchangeable end effectors and a documented API. Widely used in schools; the SDK is free but the arm is closed and limited in reach. Dobot itself does not list a price; authorized distributors do.",
    sdk: "full",
    sdkNote: "Dobot API and demos in several languages plus DobotLab Blockly are included with every unit. No tiers.",
    languages: ["Python", "C++", "C#", "Java", "Blockly"],
    openHardware: "no",
    lerobot: "none",
    sim: "None official",
    availability: "In stock from education distributors",
    conf: "medium",
    confNote: "Dobot's site lists no price. The authorized distributor RobotLAB lists $1,899; other resellers range $1,695 to $1,999.",
    priceNote: "Magician V3 Standard Edition at RobotLAB",
    tiers: [
      { name: "Magician V3 Standard (RobotLAB)", price: 1899, includesSdk: true },
    ],
    src: { url: "https://www.robotlab.com/store/dobot-magician-v3-standard-edition/", title: "Dobot Magician V3 Standard Edition", publisher: "RobotLAB", quote: "Starting at $1,899", field: "price" },
    extraSources: [
      { url: "https://www.dobot-robots.com/products/education/magician.html", title: "Dobot Magician product page", publisher: "Dobot", field: "sdk_access" },
    ],
    dof: 4,
    payloadKg: 0.5,
    weightKg: 3.4,
  },
  {
    slug: "openmanipulator-x",
    name: "ROBOTIS OpenMANIPULATOR-X",
    company: "robotis",
    form: "arm",
    notes:
      "A four-axis DYNAMIXEL arm with published CAD and official ROS 2 packages, the standard manipulator for TurtleBot 3 and a common first arm in ROS courses. ROBOTIS also publishes a LeRobot integration and imitation-learning demo for it.",
    sdk: "full",
    sdkNote: "Open-source ROS 2 packages, the DYNAMIXEL SDK and Arduino support are available to every buyer. No tiers.",
    languages: ["C++", "Python", "ROS 2", "Arduino"],
    openHardware: "yes",
    openHardwareNote: "CAD published on Onshape and Thingiverse; software open source.",
    lerobot: "supported",
    sim: "Gazebo packages from ROBOTIS",
    availability: "In stock on ROBOTIS' US store",
    conf: "high",
    confNote: "Price read on the official store. LeRobot support is vendor-published, not in the LeRobot core robot list.",
    priceNote: "Full kit, RM-X52-TNM",
    tiers: [
      { name: "OpenMANIPULATOR-X (RM-X52-TNM)", price: 1629.09, includesSdk: true },
    ],
    src: { url: "https://www.robotis.us/openmanipulator-x-rm-x52-tnm/", title: "OpenMANIPULATOR-X RM-X52-TNM", publisher: "ROBOTIS", quote: "$1,629.09, in stock", field: "price" },
    dof: 4,
    payloadKg: 0.5,
    weightKg: 0.7,
  },
  {
    slug: "berkeley-humanoid-lite",
    name: "Berkeley Humanoid Lite",
    company: "berkeley-hybrid-robotics",
    form: "humanoid",
    notes:
      "A research humanoid you build from 3D-printed parts and off-the-shelf actuators for under $5,000. Fully open, with training pipelines in Isaac Lab and MuJoCo and a published sim-to-real workflow. No commercial kit exists.",
    sdk: "full",
    sdkNote: "Open hardware and open software; there is no vendor and no tier.",
    languages: ["Python", "C++"],
    openHardware: "yes",
    openHardwareNote: "CAD, BOM, firmware and RL pipeline published.",
    lerobot: "none",
    sim: "Isaac Lab and MuJoCo environments in the repo",
    availability: "Self-build only",
    conf: "high",
    confNote: "The $5,000 figure is the project's stated ceiling for a DIY build at US prices, not a kit price.",
    priceNote: "Published BOM ceiling for a DIY build",
    tiers: [
      { name: "Full build (BOM ceiling)", price: 5000, note: "Stated upper bound; excludes tools and printing.", includesSdk: true },
    ],
    src: { url: "https://lite.berkeley-humanoid.org/", title: "Berkeley Humanoid Lite", publisher: "UC Berkeley", quote: "keeping the total hardware cost under $5,000", field: "price" },
    extraSources: [
      { url: "https://github.com/HybridRobotics/berkeley-humanoid-lite", title: "berkeley-humanoid-lite repository", publisher: "GitHub", field: "open_hardware" },
    ],
    dof: 22,
    heightCm: 100,
    weightKg: 16,
  },
  {
    slug: "openarm",
    name: "OpenArm",
    company: "enactic",
    form: "bimanual",
    notes:
      "An open-source pair of 7-DoF arms designed for teleoperation and imitation learning at a fraction of commercial bimanual rigs. Uses off-the-shelf actuators over CAN and ships with ROS 2 and Python control. Certified vendors sell complete systems.",
    sdk: "full",
    sdkNote: "Open hardware and open software with CAN and ROS 2 control; certified vendors sell complete systems but no tier withholds access.",
    languages: ["Python", "C++", "ROS 2"],
    openHardware: "yes",
    openHardwareNote: "CAD, BOM and firmware published under an open license.",
    lerobot: "native",
    sim: "MuJoCo and Isaac assets in the repo",
    availability: "In stock from certified vendors; lead time 20 to 40 days",
    conf: "high",
    confNote: "Price from the project's official purchase page for a certified vendor build. Uncertified vendors range $4,699 to $7,080.",
    priceNote: "Bimanual OpenArm 2.0 from a certified vendor (WowRobo)",
    tiers: [
      { name: "Bimanual OpenArm 2.0 (certified vendor)", price: 6500, note: "Lead time 20 to 40 days.", includesSdk: true },
    ],
    src: { url: "https://docs.openarm.dev/purchase/", title: "OpenArm purchase page", publisher: "Enactic", quote: "Bimanual OpenArm 2.0: $6,500", field: "price" },
    extraSources: [
      { url: "https://github.com/enactic/openarm", title: "openarm repository", publisher: "Enactic", field: "open_hardware" },
    ],
    dof: 14,
    payloadKg: 3,
  },
  {
    slug: "mini-pupper-2",
    name: "Mini Pupper 2",
    company: "mangdang",
    form: "quadruped",
    notes:
      "A small open-source ROS 2 quadruped on a Raspberry Pi CM4, sold pre-assembled or as a maker kit. Good for learning legged control and ROS; too small to carry any real payload.",
    sdk: "full",
    sdkNote: "ROS 2 and Python stack are open source and included with every kit. No tiers.",
    languages: ["Python", "ROS 2"],
    openHardware: "yes",
    openHardwareNote: "Hardware and software published on GitHub.",
    lerobot: "none",
    sim: "Gazebo packages in the repo",
    availability: "In stock; the Pro Maker Kit showed sold out on the check date",
    conf: "high",
    priceNote: "Pre-assembled kit",
    tiers: [
      { name: "Mini Pupper 2", price: 649, note: "Pre-assembled.", includesSdk: true, compute: "Raspberry Pi CM4" },
      { name: "Mini Pupper 2 Pro Maker Kit", price: 799, includesSdk: true, compute: "Raspberry Pi CM4" },
    ],
    src: { url: "https://mangdang.store/products/mp2", title: "Mini Pupper 2 store page", publisher: "MangDang", quote: "Sale price $649.00", field: "price" },
    dof: 12,
    weightKg: 0.9,
  },
];
