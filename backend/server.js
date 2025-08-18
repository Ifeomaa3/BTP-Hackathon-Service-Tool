// backend/server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const ServiceMatcher = require("./service-matcher");

const app = express();
const matcher = new ServiceMatcher();

app.use(cors());
app.use(bodyParser.json());

// Simple health check
app.get("/", (req, res) => {
  res.send("✅ Service Matcher API is running!");
});

// POST endpoint for matching services
app.post("/match-services", async (req, res) => {
  try {
    const customerProfile = req.body;

    if (!customerProfile || !customerProfile.customerNeeds) {
      return res.status(400).json({ error: "Missing customer profile or needs" });
    }

    const result = await matcher.matchServices(customerProfile);
    res.json(result);
  } catch (err) {
    console.error("Error in /match-services:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Service Matcher running at http://localhost:${PORT}`);
});
