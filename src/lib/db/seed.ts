/**
 * Seed PedTECH Global EdTech data: npx tsx src/lib/db/seed.ts
 */
import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "bizfix.db");
const db = new Database(DB_PATH);

const now = new Date().toISOString();
const COMPANY_ID = "pedtech-global";

// Clear existing seed data
db.exec(`
  DELETE FROM news_cache WHERE company_id = '${COMPANY_ID}';
  DELETE FROM competitors WHERE company_id = '${COMPANY_ID}';
  DELETE FROM research_reports WHERE company_id = '${COMPANY_ID}';
  DELETE FROM sales WHERE company_id = '${COMPANY_ID}';
  DELETE FROM quote_items WHERE quote_id IN (SELECT id FROM quotes WHERE company_id = '${COMPANY_ID}');
  DELETE FROM quotes WHERE company_id = '${COMPANY_ID}';
  DELETE FROM products WHERE company_id = '${COMPANY_ID}';
  DELETE FROM vendors WHERE company_id = '${COMPANY_ID}';
  DELETE FROM companies WHERE id = '${COMPANY_ID}';
`);

// ─── Company ─────────────────────────────────────────────────────────────────
db.prepare(`INSERT INTO companies VALUES (?,?,?,?,?,?)`).run(
  COMPANY_ID, "PedTECH Global", "EdTech",
  "AI-powered educational technology solutions for K-12 and higher education institutions worldwide.",
  "https://pedtechglobal.com", now
);

// ─── Vendors ─────────────────────────────────────────────────────────────────
const vendorData = [
  ["v1", COMPANY_ID, "SmartBoard Solutions", "James Carter", "james@smartboard.io", "+1 415-334-2210", "Hardware", 4.7, "active", "Net 30", 95, 42, 18, null, now],
  ["v2", COMPANY_ID, "EduSoft Labs", "Priya Nair", "priya@edusoftlabs.com", "+1 512-889-4423", "Software", 4.5, "active", "Net 60", 88, 31, 12, null, now],
  ["v3", COMPANY_ID, "LearnCloud Inc.", "Marcus Webb", "marcus@learncloud.io", "+44 20-7946-0212", "Cloud Platform", 4.8, "active", "Net 30", 97, 58, 24, null, now],
  ["v4", COMPANY_ID, "STEMKit Factory", "Anika Osei", "anika@stemkit.co", "+1 713-445-8812", "Hardware", 4.3, "active", "Net 45", 82, 19, 9, null, now],
  ["v5", COMPANY_ID, "VirtuLearn VR", "Tom Henriksen", "tom@virtulearn.io", "+1 206-521-9934", "VR/AR", 4.6, "active", "Net 60", 91, 14, 6, null, now],
  ["v6", COMPANY_ID, "DataEd Analytics", "Sofia Reyes", "sofia@dataed.ai", "+1 617-772-3301", "Analytics", 4.4, "active", "Net 30", 93, 27, 11, null, now],
  ["v7", COMPANY_ID, "PrintEdu Press", "Hassan Ali", "hassan@printedu.com", "+44 121-496-0055", "Content", 3.9, "inactive", "Net 30", 76, 8, 0, null, now],
  ["v8", COMPANY_ID, "SecureClass Tech", "Linda Park", "linda@secureclass.com", "+1 408-229-7712", "Security", 4.2, "active", "Net 30", 89, 11, 4, null, now],
];

const insertVendor = db.prepare(`INSERT INTO vendors VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
for (const v of vendorData) insertVendor.run(...v as Parameters<typeof insertVendor.run>);

// ─── Products ─────────────────────────────────────────────────────────────────
const productData = [
  // LMS
  ["p1", COMPANY_ID, "v2", "LMS-CORE-001", "EduFlow LMS — Core Edition", "Cloud-based learning management system supporting 500 concurrent users with SCORM 2004 compliance, gradebook, and parent portal.", "LMS", "Core", 1200, 2499, "standard", '["K-12","higher-ed"]', '["bestseller","cloud","SCORM"]', 20, 35, "in_stock", 3, 4.6, "Excellent uptime, responsive support.", now, now],
  ["p2", COMPANY_ID, "v2", "LMS-ENT-002", "EduFlow LMS — Enterprise", "Unlimited users, SSO, advanced analytics, custom branding, API access, and dedicated CSM.", "LMS", "Enterprise", 4800, 9999, "premium", '["K-12","higher-ed","corporate-training"]', '["enterprise","SSO","analytics"]', 18, 30, "in_stock", 5, 4.8, "Top-tier reliability.", now, now],
  ["p3", COMPANY_ID, "v3", "LMS-CLOUD-003", "LearnCloud Micro LMS", "Lightweight LMS for small schools up to 150 users. Quick deploy, mobile-first.", "LMS", "Micro", 399, 799, "budget", '["K-12","tutoring-center"]', '["mobile-first","quick-deploy"]', 22, 40, "in_stock", 2, 4.2, "Good for small schools, limited reporting.", now, now],

  // Interactive Displays
  ["p4", COMPANY_ID, "v1", "DISP-IWB-001", "SmartBoard 75\" 4K Interactive Display", "4K UHD 75\" capacitive touch display with 20-point touch, built-in Android 13, WiFi 6, and SmartAnnotate software.", "Interactive Display", "Whiteboard", 1850, 3499, "premium", '["K-12","higher-ed","corporate"]', '["4K","bestseller","android"]', 20, 32, "in_stock", 14, 4.7, "Very durable, excellent touch response.", now, now],
  ["p5", COMPANY_ID, "v1", "DISP-IWB-002", "SmartBoard 65\" HD Interactive Display", "65\" HD interactive display with 10-point touch, Windows-compatible, and included stylus kit.", "Interactive Display", "Whiteboard", 1100, 2099, "standard", '["K-12"]', '["HD","stylus","windows"]', 20, 30, "in_stock", 10, 4.5, "Solid mid-range option.", now, now],
  ["p6", COMPANY_ID, "v1", "DISP-PANEL-003", "SmartBoard 43\" Classroom Panel", "Compact 43\" panel ideal for small classrooms. Plug-and-play USB-C connection.", "Interactive Display", "Panel", 580, 1099, "budget", '["K-12","tutoring-center"]', '["compact","USB-C","budget"]', 18, 28, "in_stock", 7, 4.3, "Great value for smaller rooms.", now, now],

  // Student Devices
  ["p7", COMPANY_ID, "v4", "DEV-TAB-001", "EduTab 10 — Student Tablet", "Ruggedized 10\" Android tablet with protective case, stylus, and pre-installed EDU app suite. Drop-tested to 1.5m.", "Student Device", "Tablet", 145, 279, "standard", '["K-12"]', '["ruggedized","android","EDU-suite"]', 22, 38, "in_stock", 21, 4.4, "Kids love them, very durable.", now, now],
  ["p8", COMPANY_ID, "v4", "DEV-CHROM-002", "EduBook Chromebook 11\"", "11\" Chromebook with touchscreen, 8GB RAM, 64GB SSD. Managed Chrome OS for Google Workspace for Education.", "Student Device", "Chromebook", 210, 399, "standard", '["K-12","higher-ed"]', '["chromebook","google-workspace","touchscreen"]', 20, 34, "low_stock", 14, 4.5, "Very popular, currently low stock.", now, now],
  ["p9", COMPANY_ID, "v4", "DEV-CART-003", "32-Device Charging Cart", "Lockable charging cart for 32 tablets or Chromebooks with individual power outlets and cable management.", "Student Device", "Accessory", 420, 799, "standard", '["K-12"]', '["charging","storage","classroom"]', 18, 30, "in_stock", 10, 4.6, "Excellent build quality.", now, now],

  // VR/AR
  ["p10", COMPANY_ID, "v5", "VR-HEADSET-001", "VirtuLearn VR Headset — EDU Edition", "Standalone VR headset with 200+ curated educational experiences. Classroom management console included.", "VR/AR", "Headset", 380, 699, "premium", '["K-12","higher-ed"]', '["VR","standalone","curated-content"]', 22, 35, "in_stock", 30, 4.6, "Content library growing fast.", now, now],
  ["p11", COMPANY_ID, "v5", "VR-CONTENT-002", "VirtuLearn Annual Content License", "Annual per-device license for full VirtuLearn content library (500+ experiences, STEM + humanities).", "VR/AR", "License", 60, 120, "standard", '["K-12","higher-ed"]', '["SaaS","content","annual"]', 20, 45, "in_stock", 1, 4.7, "High margin SaaS product.", now, now],

  // Analytics
  ["p12", COMPANY_ID, "v6", "ANLY-DASH-001", "DataEd Student Analytics Platform", "AI-powered learning analytics. Tracks engagement, predicts at-risk students, and generates teacher insights. Per-school annual license.", "Analytics", "Platform", 900, 1899, "premium", '["K-12","higher-ed"]', '["AI","predictive","teacher-insights"]', 20, 40, "in_stock", 5, 4.4, "Powerful tool, requires data integration setup.", now, now],
  ["p13", COMPANY_ID, "v6", "ANLY-REPORT-002", "DataEd Quick Reports Add-on", "One-time setup of custom reporting dashboards per institution. Includes 3 months support.", "Analytics", "Service", 300, 599, "standard", '["K-12","higher-ed"]', '["reporting","custom","support"]', 20, 30, "in_stock", 14, 4.2, "Good add-on upsell.", now, now],

  // Assessment
  ["p14", COMPANY_ID, "v3", "ASSESS-PLT-001", "LearnCloud Assessment Engine", "Adaptive online assessment platform with item banking, proctoring, and standards mapping. Annual school license.", "Assessment", "Platform", 700, 1399, "standard", '["K-12","higher-ed"]', '["adaptive","proctoring","standards"]', 20, 35, "in_stock", 5, 4.5, "Strong alternative to Pearson.", now, now],

  // STEM Kits
  ["p15", COMPANY_ID, "v4", "STEM-KIT-001", "Robotics Starter Kit — Grade 3-6", "Class set of 10 programmable robots with curriculum guide (20 lessons), teacher manual, and parts storage.", "STEM Kit", "Robotics", 380, 749, "standard", '["K-12"]', '["robotics","curriculum","class-set"]', 20, 30, "in_stock", 21, 4.5, "Popular with schools doing coding curriculum.", now, now],
  ["p16", COMPANY_ID, "v4", "STEM-KIT-002", "Advanced Coding & Electronics Kit", "Arduino-based electronics kit for grades 7-12. 15 units with sensors, breadboards, and 30-lesson curriculum.", "STEM Kit", "Electronics", 520, 999, "premium", '["K-12"]', '["arduino","electronics","advanced"]', 20, 32, "made_to_order", 28, 4.6, "Excellent for secondary STEM programs.", now, now],

  // Security
  ["p17", COMPANY_ID, "v8", "SEC-FILTER-001", "SecureClass Web Filter — Annual", "CIPA-compliant web filtering for K-12 with AI content categorization, reporting, and parent controls. Per-school annual.", "Security", "Software", 280, 549, "standard", '["K-12"]', '["CIPA","compliance","web-filter"]', 20, 35, "in_stock", 3, 4.2, "Straightforward compliance solution.", now, now],
];

const insertProduct = db.prepare(`INSERT INTO products VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
for (const p of productData) insertProduct.run(...p as Parameters<typeof insertProduct.run>);

// ─── Quotes ───────────────────────────────────────────────────────────────────
const quoteData = [
  ["q1", COMPANY_ID, "Riverside Unified School District", "District-Wide LMS Deployment", "accepted", 47988, 32.1, 3, null, "2026-01-15T09:00:00Z", "2026-02-15T09:00:00Z"],
  ["q2", COMPANY_ID, "St. Catherine's Academy", "Interactive Display Rollout — 20 Classrooms", "sent", 41980, 30.5, 2, null, "2026-02-20T10:00:00Z", "2026-04-20T10:00:00Z"],
  ["q3", COMPANY_ID, "Apex Online University", "Enterprise LMS + Analytics Bundle", "accepted", 119970, 34.2, 4, null, "2026-01-08T08:00:00Z", "2026-02-08T08:00:00Z"],
  ["q4", COMPANY_ID, "Greenfield Primary School", "Starter Tech Package", "sent", 8390, 34.8, 3, null, "2026-03-01T11:00:00Z", "2026-04-30T11:00:00Z"],
  ["q5", COMPANY_ID, "TechBridge Charter Schools", "VR Pilot Program — 5 Schools", "draft", 20950, 35.1, 2, null, "2026-03-20T09:00:00Z", "2026-05-20T09:00:00Z"],
  ["q6", COMPANY_ID, "Bright Futures Tutoring", "Micro LMS + Tablets", "declined", 5585, 37.2, 2, null, "2026-02-10T14:00:00Z", "2026-03-10T14:00:00Z"],
  ["q7", COMPANY_ID, "Wellington College", "STEM Lab Refresh", "accepted", 22470, 31.4, 3, null, "2026-02-28T08:00:00Z", "2026-03-28T08:00:00Z"],
  ["q8", COMPANY_ID, "Dubai Knowledge Foundation", "Premium EdTech Suite", "sent", 87960, 33.8, 5, null, "2026-03-15T08:00:00Z", "2026-05-15T08:00:00Z"],
];

const insertQuote = db.prepare(`INSERT INTO quotes VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
for (const q of quoteData) insertQuote.run(...q as Parameters<typeof insertQuote.run>);

// ─── Sales ────────────────────────────────────────────────────────────────────
const salesData = [
  // Jan
  ["s1", COMPANY_ID, "q1", "Riverside Unified School District", "p2", "EduFlow LMS — Enterprise", "LMS", 3, 9999, 29997, 14400, 51.9, "completed", "2026-01-20", now],
  ["s2", COMPANY_ID, "q1", "Riverside Unified School District", "p12", "DataEd Student Analytics Platform", "Analytics", 2, 1899, 3798, 1800, 52.6, "completed", "2026-01-20", now],
  ["s3", COMPANY_ID, "q3", "Apex Online University", "p2", "EduFlow LMS — Enterprise", "LMS", 5, 9999, 49995, 24000, 52, "completed", "2026-01-12", now],
  ["s4", COMPANY_ID, "q3", "Apex Online University", "p12", "DataEd Student Analytics Platform", "Analytics", 3, 1899, 5697, 2700, 52.6, "completed", "2026-01-12", now],
  // Feb
  ["s5", COMPANY_ID, "q7", "Wellington College", "p15", "Robotics Starter Kit — Grade 3-6", "STEM Kit", 12, 749, 8988, 4560, 49.2, "completed", "2026-02-05", now],
  ["s6", COMPANY_ID, "q7", "Wellington College", "p16", "Advanced Coding & Electronics Kit", "STEM Kit", 8, 999, 7992, 4160, 48, "completed", "2026-02-05", now],
  ["s7", COMPANY_ID, null, "Harris County ISD", "p7", "EduTab 10 — Student Tablet", "Student Device", 200, 279, 55800, 29000, 48, "completed", "2026-02-14", now],
  ["s8", COMPANY_ID, null, "Harris County ISD", "p9", "32-Device Charging Cart", "Student Device", 10, 799, 7990, 4200, 47.4, "completed", "2026-02-14", now],
  // Mar
  ["s9", COMPANY_ID, null, "National EdTech Summit", "p10", "VirtuLearn VR Headset — EDU Edition", "VR/AR", 30, 699, 20970, 11400, 45.7, "completed", "2026-03-05", now],
  ["s10", COMPANY_ID, null, "National EdTech Summit", "p11", "VirtuLearn Annual Content License", "VR/AR", 30, 120, 3600, 1800, 50, "completed", "2026-03-05", now],
  ["s11", COMPANY_ID, null, "Singapore MOE Pilot", "p4", "SmartBoard 75\" 4K Interactive Display", "Interactive Display", 15, 3499, 52485, 27750, 47.1, "completed", "2026-03-18", now],
  ["s12", COMPANY_ID, null, "Kingsway Academy", "p14", "LearnCloud Assessment Engine", "Assessment", 1, 1399, 1399, 700, 50, "completed", "2026-03-22", now],
];

const insertSale = db.prepare(`INSERT INTO sales VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
for (const s of salesData) insertSale.run(...s as Parameters<typeof insertSale.run>);

// ─── Competitors ─────────────────────────────────────────────────────────────
const competitorData = [
  ["c1", COMPANY_ID, "Instructure (Canvas)", "https://instructure.com", "LMS", "Market leader, strong HE presence, rich plugin ecosystem", "Expensive enterprise tier, complex onboarding", "$500M+ ARR", "Primary LMS competitor in higher ed", "2026-03-01"],
  ["c2", COMPANY_ID, "Promethean", "https://prometheanworld.com", "Interactive Display", "Strong brand in K-12, ActivePanel range well established", "Limited software ecosystem, hardware-only play", "$200M est.", "Main IWB competitor in K-12", "2026-03-01"],
  ["c3", COMPANY_ID, "ClassDojo", "https://classdojo.com", "Engagement Platform", "Massive consumer adoption, free tier viral growth", "Minimal enterprise features, monetization unclear", "$500M valuation", "Indirect competitor for parent/teacher engagement", "2026-03-01"],
  ["c4", COMPANY_ID, "Nearpod", "https://nearpod.com", "Interactive Content", "Strong lesson content library, good teacher UX", "No hardware play, limited analytics depth", "$50M est.", "Competes on interactive lessons", "2026-03-01"],
  ["c5", COMPANY_ID, "Pearson", "https://pearson.com", "Assessment + Content", "Enormous content library, global brand trust", "Slow innovation, legacy tech debt, expensive licensing", "$1B+ ARR", "Dominant in standardized assessment", "2026-03-01"],
];

const insertComp = db.prepare(`INSERT INTO competitors VALUES (?,?,?,?,?,?,?,?,?,?)`);
for (const c of competitorData) insertComp.run(...c as Parameters<typeof insertComp.run>);

console.log("✓ PedTECH Global seed data inserted");
db.close();
