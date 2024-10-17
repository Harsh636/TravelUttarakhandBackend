import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import multer from "multer";
import db from "./db.js";
import dotenv from "dotenv";


dotenv.config();

const port = process.env.PORT || 5000;

// create app
const app = express();



// middleware

app.use('/uploads', express.static('uploads'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({extended: false}));
app.use(cors());
app.use(express.json());

app.use(
  cors({
    origin: "https://traveluttarakhand.netlify.app",
    methods: ['GET', 'POST'],
  })
);
app.use('/images', express.static('./uploads'));

//Storeing image into uploads folder using multer and changing image name using Date.now() to prevent same name
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads"); 
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({storage: storage});

db.connect();

// create a track
app.post("/new-trek", upload.fields([{ name: "image" }, { name: "banner" }, { name: "mainImage" }]), async (req, res) => { 
  const imagePath = req.files.image ? req.files.image[0].path : null;
  const bannerPath = req.files.banner ? req.files.banner[0].path : null;
  const mainImagePath = req.files.mainImage ? req.files.mainImage[0].path : null;
    try {
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

      console.log("Values being inserted:", values);
      const result = await db.query(insertQuery, values);
      res.status(200).json(result.rows[0]);
    } catch (err) {
      console.error("Database error:", err);
      res
        .status(500)
        .send("Error occurred while uploading the trek: " + err.message);
    }
  }
);


// GET ALL TRACK
app.get("/treks", async (req, res) => {
  try {
    // Fetch all treks from the database
    const allTracks = await db.query(
      "SELECT id, name, duration, difficulty, realprice, discountedprice, image FROM treks"
    );

    // Map the results to include the full image URL
    const treksWithImageUrls = allTracks.rows.map(trek => {
      return {
        ...trek,
        image: `https://traveluttarakhandbackend.onrender.com/uploads/${trek.image.replace(/\\/g, '/')}` // Convert backslashes to forward slashes
      };
    });

    // console.log(treksWithImageUrls); // Check the transformed data
    res.json(treksWithImageUrls); // Send the response
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error fetching tracks.");
  }
});


// GET TREK DETAILS

// Route to get trek details by ID
app.get("/trekdetails/:id", async (req, res) => {
  const { id } = req.params; // Extract trek ID from URL parameter
  console.log(id);

  try {
    // Query to fetch trek details based on ID
    const trekDetailsQuery = `
      SELECT id, banner, mainimage, name, duration, difficulty, heading, details, overview, highlight, itinerary FROM treks WHERE id = $1;
    `;
    const values = [id]; // Pass the trek ID to the query
    const result = await db.query(trekDetailsQuery, values); // Execute query

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Trek details not found" });
    }

    // Get the single trek detail
    const details = result.rows[0];
    const trekDetails = details.details;
    const trekit = details.itinerary;
    // Destructure the nested objects
    const {
      altitude,
      distance,
      transportation,
      meals,
      bestSeason,
      trekType,
    } = trekDetails; // Assuming details.details is an object

    const { dayHighlight, dayExplain } = trekit; // Assuming details.itinerary is an object
    // console.log(details.mainImage);

    // Create a response object
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
      banner: `https://traveluttarakhandbackend.onrender.com/uploads/${details.banner.replace(/\\/g, '/')}`,
      mainImage: `https://traveluttarakhandbackend.onrender.com/uploads/${details.mainimage.replace(/\\/g, '/')}`,
    };

    console.log(responseData); // For debugging
    res.json(responseData); // Return the trek details as JSON
  } catch (err) {
    console.error("Error fetching trek details:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// update track
// app.put("/track/:id", (req,res)=>{
//     const {id} = req.params;
//     const {name} = req.body;
//     const updateTrack = db.query("UPDATE test SET name = $1 WHERE id=$2",[name, id]);
//     res.json("track is updated.");
// });

// delete track.
// app.delete("/track/:id", (req, res)=>{
//     try {
//         const {id} = req.params;
//         const deleteTrack = db.query("DELETE FROM test WHERE id = $1", [id]);
//         res.json("track was deleted.");
//     } catch (err) {
//         console.log(err.message);
//     }
// });

app.listen(port, () => {
  console.log(`Server has started on port ${port}...`);
});

