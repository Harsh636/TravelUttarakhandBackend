import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import multer from "multer";
import db from "./db.js";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, 'uploads');



dotenv.config();

const port = process.env.PORT || 5000;

// create app
const app = express();

// yesssssssssssssssssssssss
// dsfsfdfsadf
// Middleware for serving static files
app.use('/uploads', express.static('uploads'));

// Middleware for parsing URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: false }));
app.use(cors()); // Enable CORS for all origins
app.use(express.json()); // Parse JSON bodies

// Multer storage configuration for handling file uploads
// Create the uploads directory if it does not exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
      cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage: storage });

// Connect to the database
// db.connect();

app.post("/create-and-insert-simple", async (req, res) => {
  try {
    // Create a simple table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS example_table (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        age INT NOT NULL
      );
    `;
    await db.query(createTableQuery);

    // Insert values into the simple table
    const { name, age } = req.body;
    const insertQuery = `
      INSERT INTO example_table (name, age)
      VALUES (?, ?);
    `;

    await db.query(insertQuery, [name, age]);

    res.status(200).send("Simple table created and values inserted successfully.");
  } catch (error) {
    console.error("Error creating table or inserting values:", error);
    res.status(500).send("An error occurred.");
  }
});

// Create a new trek
app.post("/new-trek", upload.fields([{ name: "image" }, { name: "banner" }, { name: "mainImage" }]), async (req, res) => { 
  // Retrieve file paths from the uploaded files
  const baseURL = `${req.protocol}s://${req.get('host')}/uploads/`;

  const imagePath = req.files.image ? `${baseURL}${req.files.image[0].filename}` : null;
  const bannerPath = req.files.banner ? `${baseURL}${req.files.banner[0].filename}` : null;
  const mainImagePath = req.files.mainImage ? `${baseURL}${req.files.mainImage[0].filename}` : null;

  try {
    // Destructure values from req.body
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

    // Prepare SQL insert statement
    const insertQuery = `
  INSERT INTO treks (name, duration, difficulty, realprice, discountedprice, image, banner, mainimage, heading, details, overview, highlight, itinerary)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  RETURNING *;
`;

    
    // Prepare values for the insert
    const values = [
      name,
      duration,
      difficulty,
      parseFloat(realPrice), // Ensure prices are parsed as floats
      parseFloat(discountedPrice), // Ensure prices are parsed as floats
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

    // Execute the insert query
    const result = await db.query(insertQuery, values);
    
    // Respond with the newly created trek
    res.status(200).json(result.rows[0]);
  } catch (err) {
    // Log and send error details
    console.error("Database error:", err);
    res.status(500).json({ message: "Error occurred while uploading the trek", error: err.message });
  }
});


// // middleware
// app.use('/uploads', express.static('uploads'));
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(express.urlencoded({extended: false}));
// app.use(cors());
// app.use(express.json()); //req.body

// // app.use(
// //   cors({
// //     origin: "https://traveluttarakhand.netlify.app",
// //   })
// // );
// //Storeing image into uploads folder using multer and changing image name using Date.now() to prevent same name
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "./uploads"); 
//   },
//   filename: function (req, file, cb) {
//     cb(null, `${Date.now()}-${file.originalname}`);
//   },
// });
// const upload = multer({storage: storage});

// db.connect();

// // create a track
// app.post("/new-trek", upload.fields([{ name: "image" }, { name: "banner" }, { name: "mainImage" }]), async (req, res) => { 
//   const imagePath = req.files.image ? req.files.image[0].path : null;
//   const bannerPath = req.files.banner ? req.files.banner[0].path : null;
//   const mainImagePath = req.files.mainImage ? req.files.mainImage[0].path : null;
//     try {
//       const {
//         name,
//         duration,
//         difficulty,
//         realPrice,
//         discountedPrice,
//         heading,
//         overview,
//         highlight,
//         itinerary,
//         itinerary_details,
//         altitude,
//         distance,
//         transportation,
//         meals,
//         season,
//         trek_type,
//       } = req.body;
      
//       const insertQuery = `
//       INSERT INTO treks (name, duration, difficulty, realprice, discountedprice, image, banner, mainimage, heading, details, overview, highlight, itinerary)
//       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
//       RETURNING *;
//       `;
//       const values = [
//         name,
//         duration,
//         difficulty,
//         parseFloat(realPrice),
//         parseFloat(discountedPrice),
//         imagePath,
//         bannerPath,
//         mainImagePath,
//         heading,
//         JSON.stringify({
//           altitude,
//           distance,
//           transportation,
//           meals,
//           bestSeason: season,
//           trekType: trek_type,
//         }),
//         overview,
//         highlight,
//         JSON.stringify({
//           dayHighlight: itinerary,
//           dayExplain: itinerary_details,
//         }),
//       ];

//       console.log("Values being inserted:", values);
//       const result = await db.query(insertQuery, values);
//       res.status(200).json(result.rows[0]);
//     } catch (err) {
//       console.error("Database error:", err);
//       res
//         .status(500)
//         .send("Error occurred while uploading the trek: " + err.message);
//     }
//   }
// );


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
        image: `${trek.image.replace(/\\/g, '/')}` // Convert backslashes to forward slashes
      };
    });

    console.log(treksWithImageUrls); // Check the transformed data
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
      SELECT id, banner, mainimage, name, duration, difficulty, heading, details, overview, highlight, itinerary FROM treks WHERE id = ?;
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
      banner: `${details.banner.replace(/\\/g, '/')}`,
      mainImage: `${details.mainimage.replace(/\\/g, '/')}`,
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

// import express from "express";
// import cors from "cors";
// import bodyParser from "body-parser";
// import multer from "multer";
// import db from "./db.js";
// import dotenv from "dotenv";

// dotenv.config(); // Load environment variables

// const port = process.env.PORT || 5000; // Use environment variable for port

// // create app
// const app = express();

// // middleware
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(cors());
// app.use(express.json());

// // multer setup
// const storage = multer.memoryStorage();
// const upload = multer({ storage: storage });

// db.connect();

// // routes

// // create a track
// app.post("/new-track", upload.single("image"), async (req, res) => {
//   try {
//     const { name, duration, difficulty, realPrice, discountedPrice } = req.body;
//     const image = req.file;

//     if (!image) {
//       return res.status(400).send("Image file is required");
//     }
//     const imageData = image.buffer;

//     const insertQuery = `
//       INSERT INTO tracks (name, duration, difficulty, realPrice, discountedPrice, image)
//       VALUES ($1, $2, $3, $4, $5, $6)
//       RETURNING *;
//     `;
//     const values = [
//       name,
//       duration,
//       difficulty,
//       parseFloat(realPrice),
//       parseFloat(discountedPrice),
//       imageData,
//     ];

//     const result = await db.query(insertQuery, values);
//     res.status(201).json(result.rows[0]); // Use 201 for created resource
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send("Error occurred while uploading the track.");
//   }
// });

// // GET ALL TRACKS
// app.get("/tracks", async (req, res) => {
//   try {
//     const allTracks = await db.query("SELECT * FROM tracks");

//     // Convert the image buffer to a Base64 string
//     const tracksWithBase64Images = allTracks.rows.map(track => ({
//       ...track,
//       image: track.image ? `data:image/jpeg;base64,${track.image.toString('base64')}` : null,
//     }));

//     res.json(tracksWithBase64Images);
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send("Error fetching tracks.");
//   }
// });

// // Update track (uncomment if needed)
// // app.put("/track/:id", async (req, res) => {
// //   const { id } = req.params;
// //   const { name } = req.body;
// //   try {
// //     await db.query("UPDATE tracks SET name = $1 WHERE id = $2", [name, id]);
// //     res.json("Track updated.");
// //   } catch (err) {
// //     console.error(err.message);
// //     res.status(500).send("Error updating track.");
// //   }
// // });

// // Delete track (uncomment if needed)
// // app.delete("/track/:id", async (req, res) => {
// //   const { id } = req.params;
// //   try {
// //     await db.query("DELETE FROM tracks WHERE id = $1", [id]);
// //     res.json("Track deleted.");
// //   } catch (err) {
// //     console.error(err.message);
// //     res.status(500).send("Error deleting track.");
// //   }
// // });

// app.listen(port, () => {
//   console.log(`Server has started on port ${port}...`);
// });
