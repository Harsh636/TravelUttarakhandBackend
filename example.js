app.get("/trekdetails/:id", async (req, res) => {
    const { id } = req.params; // Extract trek ID from URL parameter
    console.log(id);
    
    try {
      // Query to fetch trek details based on ID
      const trekDetailsQuery = `
        SELECT * FROM trekdetails WHERE id = $1;
      `;
      const values = [id]; // Pass the trek ID to the query
      const result = await db.query(trekDetailsQuery, values); // Execute query
  
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Trek details not found" });
      }
  
      // Get the single trek detail
      const details = result.rows[0];
      
      // Parse the 'details' and 'itinerary' fields if they are JSON strings in the database
      const trekDetails = JSON.parse(details.details);
      const trekit = JSON.parse(details.itinerary);
  
      // Destructure the nested objects
      const { 
        duration, 
        difficulty, 
        altitude, 
        distance, 
        transportation, 
        meals, 
        season, 
        trekType 
      } = trekDetails; // Assuming details.details is an object
  
      const { 
        dayHighlight, 
        dayExplain 
      } = trekit; // Assuming details.itinerary is an object
  
      // Convert image to Base64 format
      const base64Image = details.banner 
        ? `data:banner/jpeg;base64,${details.banner.toString("base64")}` 
        : null; // Handle case where image might be null
  
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
        season,
        trekType,
        dayHighlight,
        dayExplain,
        banner: base64Image,
      };
  
      console.log(responseData); // For debugging
      res.json(responseData); // Return the trek details as JSON
    } catch (err) {
      console.error("Error fetching trek details:", err.message);
      res.status(500).json({ error: "Server error" });
    }
  });