import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import multer from "multer";
import db from "./db.js";
import dotenv from "dotenv";
import sharp from "sharp";

dotenv.config();

const port = process.env.PORT || 5000;

// create app
const app = express();

// middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json()); //req.body
app.use(
  cors({
    origin: "https://traveluttarakhand.netlify.app",
  })
);
//multeradd

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

db.connect();

// create a track
app.post(
  "/new-trek",
  upload.fields([{ name: "image" }, { name: "banner" }, { name: "mainImage" }]),
  async (req, res) => {
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

      console.log("Incoming data:", req.body);
      console.log("Uploaded files:", req.files);

      // Check if image exists
      const imageData = req.files.image ? req.files.image[0].buffer : null;
      if (!imageData) {
        return res.status(400).send("Image data is required.");
      }
      const webpImageBuffer = await sharp(imageData)
        .webp({ quality: 100 })
        .toBuffer();

      // Check if banner exists
      const bannerImage = req.files.banner ? req.files.banner[0].buffer : null;
      const webpBanner = bannerImage
        ? await sharp(bannerImage).webp({ quality: 100 }).toBuffer()
        : null;

      // Check if mainImage exists
      const mainImage = req.files.mainImage
        ? req.files.mainImage[0].buffer
        : null;
      const webpMainImage = mainImage
        ? await sharp(mainImage).webp({ quality: 100 }).toBuffer()
        : null;

      // Validation for required images
      if (!webpImageBuffer) {
        return res.status(400).send("The main trek image is required.");
      }
      if (!webpBanner || !webpMainImage) {
        return res
          .status(400)
          .send("Both the banner and main image are required.");
      }

      const insertQuery = `
      INSERT INTO treks (name, duration, difficulty, realPrice, discountedPrice, image, banner, mainImage, heading, details, overview, highlight, itinerary)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *;
      `;
      const values = [
        name,
        duration,
        difficulty,
        parseFloat(realPrice),
        parseFloat(discountedPrice),
        webpImageBuffer,
        webpBanner,
        webpMainImage,
        heading,
        JSON.stringify({
          duration,
          difficulty,
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

// // set track details
// app.post("/new-trek-details", upload.fields([{ name: 'banner' }, { name: 'mainImage' }]), async (req, res) => {
//   try {
//     const {
//       name,
//       heading,
//       overview,
//       highlight,
//       itinerary,
//       itinerary_details,
//       duration,
//       difficulty,
//       altitude,
//       distance,
//       transportation,
//       meals,
//       season,
//       trek_type,
//     } = req.body;
//     const bannerImage = req.files.banner ? req.files.banner[0].buffer : null;
//     const webpBanner = await sharp(bannerImage)
//       .webp({ quality: 100 }) // Optional: Set quality (0-100)
//       .toBuffer();
//     const mainImage = req.files.mainImage ? req.files.mainImage[0].buffer : null;
//     const webpMainImage = await sharp(mainImage)
//       .webp({ quality: 100 }) // Optional: Set quality (0-100)
//       .toBuffer();
//     if (!webpBanner || !webpMainImage) {
//       return res.status(400).send("Both banner and mainImage images are required");
//     }

//     const insertQuery = `
//     INSERT INTO trekdetails (banner, mainImage, name, heading, details, overview, highlight, itinerary)
//     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
//     RETURNING *;
//     `;
//     const values = [
//       webpBanner,
//       webpMainImage,
//       name,
//       heading,
//       `{"duration": "${duration}","difficulty":"${difficulty}", "altitude":"${altitude}", "distance":"${distance}", "transportation":"${transportation}", "meals":"${meals}", "bestSeason":"${season}", "trekType":"${trek_type}"}`,
//       overview,
//       highlight,
//       `{"dayHighlight": "${itinerary}", "dayExplain": "${itinerary_details}"}`,
//     ];

//     const result = await db.query(insertQuery, values);
//     console.log(result.rows[0]);
//     res.status(200).json(result.rows[0]);
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send("Error occurred while uploading the track.");
//   }
// });

// GET ALL TRACK
app.get("/treks", async (req, res) => {
  try {
    const allTracks = await db.query(
      "SELECT id, name, duration, difficulty, realPrice, discountedPrice, image FROM treks"
    );

    // Convert the image buffer to a Base64 string
    const tracksWithBase64Images = allTracks.rows.map((track) => {
      return {
        ...track,
        image: track.image
          ? `data:image/jpeg;base64,${track.image.toString("base64")}`
          : null, // Convert buffer to Base64 string
      };
    });
    res.json(tracksWithBase64Images);
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
      SELECT id, banner, mainimage, name, heading, details, overview, highlight, itinerary FROM treks WHERE id = $1;
    `;
    const values = [id]; // Pass the trek ID to the query
    const result = await db.query(trekDetailsQuery, values); // Execute query

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Trek details not found" });
    }

    // Get the single trek detail
    const details = result.rows[0];
    console.log(details);
    const trekDetails = details.details;
    const trekit = details.itinerary;
    // Destructure the nested objects
    const {
      duration,
      difficulty,
      altitude,
      distance,
      transportation,
      meals,
      bestSeason,
      trekType,
    } = trekDetails; // Assuming details.details is an object

    const { dayHighlight, dayExplain } = trekit; // Assuming details.itinerary is an object
    // console.log(details.mainImage);
    // Convert image to Base64 format
    const bannerbase64Image = details.banner
      ? `data:banner/jpeg;base64,${details.banner.toString("base64")}`
      : null; // Handle case where image might be null
    const mainBase64Image = details.mainimage // Ensure this matches your DB column
      ? `data:image/jpeg;base64,${details.mainimage.toString("base64")}`
      : null;

    // Create a response object
    const responseData = {
      id: details.id,
      name: details.name,
      heading: details.heading,
      overview: details.overview,
      highlight: details.highlight,
      duration,
      difficulty,
      altitude,
      distance,
      transportation,
      meals,
      bestSeason,
      trekType,
      dayHighlight,
      dayExplain,
      banner: bannerbase64Image,
      mainImage: mainBase64Image,
    };

    // console.log(responseData); // For debugging
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
