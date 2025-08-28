// src/api/exportPdf.js

const { jsPDF } = require("jspdf");
const PptxGenJS = require("pptxgenjs"); // PowerPoint generation library
const path = require('path');
const fs = require('fs');

module.exports = (app) => {
  app.post('/export', (req, res) => {
    try {
      const { customerProfile, matchedServices, addOns, format } = req.body;

      // Check the requested format (PDF or PowerPoint)
      if (format === "pdf") {
        // Generate PDF
        generatePdf(customerProfile, matchedServices, addOns, res);
      } else if (format === "pptx") {
        // Generate PowerPoint
        generatePptx(customerProfile, matchedServices, addOns, res);
      } else {
        res.status(400).json({ error: "Invalid format. Please specify 'pdf' or 'pptx'." });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error generating document." });
    }
  });
};

// Generate PDF using jsPDF
function generatePdf(customerProfile, matchedServices, addOns, res) {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.text("Success Plan Proposal", 20, 20);

  // Customer Info
  doc.setFontSize(12);
  doc.text(`Customer: ${customerProfile.companyName}`, 20, 40);
  doc.text(`Budget Tier: ${customerProfile.budgetTier}`, 20, 50);

  // Recommendations
  doc.text("Service Recommendations:", 20, 60);
  matchedServices.forEach((service, idx) => {
    doc.text(`Service: ${service.serviceName}`, 20, 70 + (10 * idx));
    doc.text(`Description: ${service.description}`, 20, 80 + (10 * idx));
  });

  // Add-Ons
  doc.text("Additional Add-Ons:", 20, 90 + (10 * matchedServices.length));
  addOns.forEach((addOn, idx) => {
    doc.text(`Add-On: ${addOn.name}`, 20, 100 + (10 * matchedServices.length + idx));
    doc.text(`Description: ${addOn.description}`, 20, 110 + (10 * matchedServices.length + idx));
  });

  // Export the document as a PDF
  const pdfPath = path.join(__dirname, '../data/proposal.pdf');
  doc.save(pdfPath);

  // Send file as response
  res.sendFile(pdfPath);
}

// Generate PowerPoint using PptxGenJS
function generatePptx(customerProfile, matchedServices, addOns, res) {
  const pptx = new PptxGenJS();

  // Slide 1: Title Slide
  let slide = pptx.addSlide();
  slide.addText("Success Plan Proposal", { x: 1, y: 1, fontSize: 24, bold: true });

  // Slide 2: Customer Info
  slide = pptx.addSlide();
  slide.addText(`Customer: ${customerProfile.companyName}`, { x: 1, y: 1, fontSize: 18 });
  slide.addText(`Budget Tier: ${customerProfile.budgetTier}`, { x: 1, y: 1.5, fontSize: 18 });

  // Slide 3: Recommendations
  slide = pptx.addSlide();
  slide.addText("Service Recommendations:", { x: 1, y: 1, fontSize: 18 });
  matchedServices.forEach((service, idx) => {
    slide.addText(`${service.serviceName}: ${service.description}`, { x: 1, y: 1.5 + (idx * 0.5), fontSize: 14 });
  });

  // Slide 4: Add-Ons
  slide = pptx.addSlide();
  slide.addText("Additional Add-Ons:", { x: 1, y: 1, fontSize: 18 });
  addOns.forEach((addOn, idx) => {
    slide.addText(`${addOn.name}: ${addOn.description}`, { x: 1, y: 1.5 + (idx * 0.5), fontSize: 14 });
  });

  // Export the document as a PowerPoint file
  const pptxPath = path.join(__dirname, '../data/proposal.pptx');
  pptx.writeFile({ fileName: pptxPath }).then(() => {
    // Send the PowerPoint file to the client
    res.sendFile(pptxPath);
  }).catch((error) => {
    console.error(error);
    res.status(500).json({ error: "Error generating PowerPoint." });
  });
}
