import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import multer from "multer";
import db from "./db.js";
import dotenv from "dotenv";

dotenv.config();

const port = process.env.PORT || 5000;

// Create app
const app = express();

// Middleware
app.use(
  cors({
    origin: "https://traveluttarakhand.netlify.app",
    methods: ['GET', 'POST'],
  })
);
app.use('/uploads', express.static('uploads'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());



// Configure multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Connect to the database
db.connect();

// Create a new trek
app.post("/new-trek", upload.fields([{ name: "image" }, { name: "banner" }, { name: "mainImage" }]), async (req, res) => {
  console.log(req.get('host'))
  try {
    
    const imagePath = req.files.image ? `${req.protocol}://${req.get('host')}/uploads/${req.files.image[0].path.replace(/\\/g, '/')}` : null;
    const bannerPath = req.files.banner ? `${req.protocol}://${req.get('host')}/uploads/${req.files.banner[0].path.replace(/\\/g, '/')}` : null;
    const mainImagePath = req.files.mainImage ? `${req.protocol}://${req.get('host')}/uploads/${req.files.mainImage[0].path.replace(/\\/g, '/')}` : null;

    const {
      name,
      duration,
      difficulty,
      realPrice,
      discountedPrice,
      heading,
      overview,
      highlight,
      itinerary,
      itinerary_details,
      altitude,
      distance,
      transportation,
      meals,
      season,
      trek_type,
    } = req.body;

    const insertQuery = `
      INSERT INTO treks (name, duration, difficulty, realprice, discountedprice, image, banner, mainimage, heading, details, overview, highlight, itinerary)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *;
    `;
    const values = [
      name,
      duration,
      difficulty,
      parseFloat(realPrice),
      parseFloat(discountedPrice),
      imagePath,
      bannerPath,
      mainImagePath,
      heading,
      JSON.stringify({
        altitude,
        distance,
        transportation,
        meals,
        bestSeason: season,
        trekType: trek_type,
      }),
      overview,
      highlight,
      JSON.stringify({
        dayHighlight: itinerary,
        dayExplain: itinerary_details,
      }),
    ];

    const result = await db.query(insertQuery, values);
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Database error:", err.message);
    res.status(500).json({ error: "Error occurred while uploading the trek." });
  }
});

// Get all treks
app.get("/treks", async (req, res) => {
  try {
    const allTreks = await db.query(
      "SELECT id, name, duration, difficulty, realprice, discountedprice, image FROM treks"
    );


    res.json(allTreks);
  } catch (err) {
    console.error("Error fetching treks:", err.message);
    res.status(500).json({ error: "Error fetching treks." });
  }
});

// Get trek details by ID
app.get("/trekdetails/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const trekDetailsQuery = `
      SELECT id, banner, mainimage, name, duration, difficulty, heading, details, overview, highlight, itinerary 
      FROM treks 
      WHERE id = $1;
    `;
    const result = await db.query(trekDetailsQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Trek details not found" });
    }

    const details = result.rows[0];
    const trekDetails = details.details;
    const trekItinerary = details.itinerary;

    const {
      altitude,
      distance,
      transportation,
      meals,
      bestSeason,
      trekType,
    } = trekDetails;

    const { dayHighlight, dayExplain } = trekItinerary;

    const responseData = {
      id: details.id,
      name: details.name,
      heading: details.heading,
      overview: details.overview,
      highlight: details.highlight,
      duration: details.duration,
      difficulty: details.difficulty,
      altitude,
      distance,
      transportation,
      meals,
      bestSeason,
      trekType,
      dayHighlight,
      dayExplain,
      banner: details.banner,
      mainImage: details.mainimage,
    };

    res.json(responseData);
  } catch (err) {
    console.error("Error fetching trek details:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}...`);
});
