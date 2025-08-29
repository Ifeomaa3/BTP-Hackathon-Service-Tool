// src/api/exportPdf.js

// Patch jsPDF for Node
global.window = { document: { createElementNS: () => ({}) } };
global.navigator = {};
global.btoa = () => {};

const { jsPDF } = require("jspdf/dist/jspdf.node.min");
const PptxGenJS = require("pptxgenjs");
const path = require('path');

module.exports = (app) => {
  app.post('/export', async (req, res) => {
    try {
      const { customerProfile, matchedServices, addOns, format } = req.body;

      if (format === "pdf") {
        await generatePdf(customerProfile, matchedServices, addOns, res);
      } else if (format === "pptx") {
        await generatePptx(customerProfile, matchedServices, addOns, res);
      } else {
        res.status(400).json({ error: "Invalid format. Please specify 'pdf' or 'pptx'." });
      }
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ error: "Error generating document." });
    }
  });
};

// 🧾 Generate PDF using jsPDF (server-compatible)
async function generatePdf(customerProfile, matchedServices, addOns, res) {
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
    const y = 70 + (idx * 20);
    doc.text(`Service: ${service.serviceName}`, 20, y);
    doc.text(`Description: ${service.description}`, 20, y + 10);
  });

  // Add-Ons
  const addOnStartY = 80 + matchedServices.length * 20;
  doc.text("Additional Add-Ons:", 20, addOnStartY);
  addOns.forEach((addOn, idx) => {
    const y = addOnStartY + 10 + (idx * 20);
    doc.text(`Add-On: ${addOn.name}`, 20, y);
    doc.text(`Description: ${addOn.description}`, 20, y + 10);
  });

  // Output PDF as buffer and send
  const pdfBuffer = doc.output("arraybuffer");

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="proposal.pdf"');
  res.send(Buffer.from(pdfBuffer));
}

// 📊 Generate PowerPoint using PptxGenJS (streaming)
async function generatePptx(customerProfile, matchedServices, addOns, res) {
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
    slide.addText(`${service.serviceName}: ${service.description}`, {
      x: 1,
      y: 1.5 + (idx * 0.5),
      fontSize: 14
    });
  });

  // Slide 4: Add-Ons
  slide = pptx.addSlide();
  slide.addText("Additional Add-Ons:", { x: 1, y: 1, fontSize: 18 });
  addOns.forEach((addOn, idx) => {
    slide.addText(`${addOn.name}: ${addOn.description}`, {
      x: 1,
      y: 1.5 + (idx * 0.5),
      fontSize: 14
    });
  });

  // Stream PPTX to client
  const pptxBuffer = await pptx.stream();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
  res.setHeader('Content-Disposition', 'attachment; filename="proposal.pptx"');
  res.send(pptxBuffer);
}
