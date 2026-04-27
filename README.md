# 🌾 KrishiScan — AI Crop Disease Detector
### BCA Final Year Project | PHP + MySQL + AI API

---

## 📁 Project Structure

```
crop-disease-detector/
├── index.html              ← Main website (homepage)
├── css/
│   └── style.css           ← All styles
├── js/
│   └── app.js              ← Frontend logic
├── php/
│   ├── config.php          ← DB config & helpers
│   ├── auth.php            ← Login / Register / Logout
│   └── detect.php          ← Core disease detection engine
├── uploads/                ← Uploaded crop images saved here
├── assets/                 ← (optional) icons/images
└── database.sql            ← Full database schema + sample data
```

---

## ⚙️ Setup Instructions (XAMPP)

### Step 1 — Copy to htdocs
```
Copy entire folder to: C:\xampp\htdocs\crop-disease-detector\
```

### Step 2 — Start XAMPP
- Start **Apache** and **MySQL** from XAMPP Control Panel

### Step 3 — Create Database
1. Open browser → go to `http://localhost/phpmyadmin`
2. Click **New** → name it `crop_disease_db` → click Create
3. Click on `crop_disease_db` → click **Import**
4. Select `database.sql` → click **Go**
5. All tables and sample data will be created ✅

### Step 4 — Configure (optional)
Open `php/config.php` and update:
```php
define('DB_USER', 'root');   // your MySQL username
define('DB_PASS', '');        // your MySQL password (blank for XAMPP default)
```

### Step 5 — Open Website
Go to: `http://localhost/crop-disease-detector/`

---

## 🤖 Enable Real AI Detection (Optional but impressive!)

### Plant.id API (Free tier — 100 requests/day)
1. Go to https://plant.id and create a free account
2. Copy your API key
3. Open `php/config.php`
4. Replace: `define('PLANT_ID_API_KEY', 'YOUR_API_KEY_HERE');`
5. With your actual key

> Without API key — the app uses local database matching (still works great for demo!)

---

## ✨ Features

| Feature | Details |
|---|---|
| 🔬 Disease Detection | Upload crop photo → AI identifies disease |
| 📊 Confidence Score | Shows detection accuracy % |
| 💊 Treatment Guide | Organic + Chemical remedies |
| 📚 Disease Library | Browse 6+ diseases across 8 crops |
| 👤 User Accounts | Register/Login with bcrypt passwords |
| 🕐 Scan History | Logged-in users can view past scans |
| ⭐ Feedback System | Users rate accuracy of detection |
| 📱 Responsive | Works on mobile and desktop |
| 🌐 Expert Tips | Agricultural advisory from DB |

---

## 🗄️ Database Tables

| Table | Purpose |
|---|---|
| `users` | Farmer accounts |
| `crops` | 8 major crops with icons |
| `diseases` | 6+ diseases with symptoms, treatment, remedies |
| `detections` | Every scan logged with result |
| `feedback` | User accuracy ratings |
| `expert_tips` | Agricultural advisory content |

---

## 🎓 What to Say in Viva

**Problem Statement:**
> "India loses ₹50,000 crore annually to crop diseases. Farmers in rural areas lack access to agricultural experts. KrishiScan provides instant AI-based disease diagnosis directly from a smartphone photo — no expert needed."

**Tech Stack:**
- Frontend: HTML5, CSS3 (custom), Vanilla JavaScript
- Backend: PHP 8 with OOP-style functions
- Database: MySQL (6 relational tables, normalized)
- AI: Plant.id API with local database fallback
- Security: bcrypt passwords, file type validation, SQL prepared statements

**Highlight:**
> "The system has a fallback mechanism — if the external AI API is unavailable, it matches disease patterns from the local MySQL database. This means the app works even offline in rural areas with poor connectivity."

---

## 📌 Future Scope (mention in project report)
- Mobile app using React Native
- Multilingual support (Assamese, Hindi)
- SMS alerts to farmers via Twilio
- Integration with government crop advisory APIs
- Weather-based disease risk prediction

---

*Made with 🌱 for Assam's farmers*