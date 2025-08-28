// backend/server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const PDFDocument = require("pdfkit");
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

// --- NEW: POST endpoint for generating PDF SOW ---
app.post("/generate-sow", async (req, res) => {
  try {
    const { companyName, serviceName } = req.body;

    if (!companyName || !serviceName) {
      return res.status(400).json({ error: "companyName and serviceName are required" });
    }

    // Find service in portfolio
    const service = matcher.services.find(s => s.serviceName === serviceName);
    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    // Set response headers to download PDF
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="SOW_${serviceName.replace(/\s+/g, "_")}.pdf"`
    );
    res.setHeader("Content-Type", "application/pdf");

    // Create PDF
    const doc = new PDFDocument();
    doc.pipe(res);

    doc.fontSize(20).text("Statement of Work (SOW)", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Company: ${companyName}`);
    doc.text(`Service: ${service.serviceName}`);
    doc.text(`Category: ${service.category}`);
    doc.text(`Estimated Effort: ${service.estimatedEffortPersonDays || 0} person-days`);
    doc.text(`ROM Estimate: ${service.gRateOrPricingEstimate || "N/A"}`);
    doc.moveDown();

    doc.text("Description:", { underline: true });
    doc.text(service.description || "N/A");
    doc.moveDown();

    doc.text("Included Entitlements:", { underline: true });
    if (service.entitlements && service.entitlements.length > 0) {
      service.entitlements.forEach((e, i) => doc.text(`${i + 1}. ${e}`));
    } else {
      doc.text("None");
    }
    doc.moveDown();

    doc.text("Rationale:", { underline: true });
    doc.text(service.rationale || "N/A");

    doc.end();
  } catch (err) {
    console.error("Error in /generate-sow:", err);
    res.status(500).json({ error: "Failed to generate SOW" });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Service Matcher running at http://localhost:${PORT}`);
});
