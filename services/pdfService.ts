import { jsPDF } from "jspdf";
import { VideoFile } from "../types";

export const generatePDF = (videos: VideoFile[]) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  let yPos = 20;

  const addNewPage = () => {
    doc.addPage();
    yPos = 20;
  };

  const checkPageBreak = (heightNeeded: number) => {
    if (yPos + heightNeeded > doc.internal.pageSize.getHeight() - margin) {
      addNewPage();
      return true;
    }
    return false;
  };

  // Title
  doc.setFontSize(22);
  doc.setTextColor(14, 165, 233); // Brand color
  doc.text("Brownricebandit Virality Report", margin, yPos);
  yPos += 10;
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, margin, yPos);
  yPos += 15;

  const completedVideos = videos.filter(v => v.status === 'complete' && v.analysis);

  if (completedVideos.length === 0) {
    doc.text("No completed analyses to export.", margin, yPos);
    doc.save("brownricebandit-virality-report.pdf");
    return;
  }

  completedVideos.forEach((video, index) => {
    const result = video.analysis!;

    // Video Header
    checkPageBreak(40);
    doc.setDrawColor(200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text(`Video ${index + 1}: ${video.file.name}`, margin, yPos);
    yPos += 8;

    // Summary
    doc.setFontSize(12);
    doc.setTextColor(50);
    doc.setFont(undefined, 'bold');
    doc.text("Summary", margin, yPos);
    yPos += 6;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    const summaryLines = doc.splitTextToSize(result.transcriptSummary, contentWidth);
    checkPageBreak(summaryLines.length * 5);
    doc.text(summaryLines, margin, yPos);
    yPos += (summaryLines.length * 5) + 6;

    // Keywords
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text("Target Audience & Keywords", margin, yPos);
    yPos += 6;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    const audienceText = `Audience: ${result.audienceAnalysis}`;
    const audienceLines = doc.splitTextToSize(audienceText, contentWidth);
    checkPageBreak(audienceLines.length * 5);
    doc.text(audienceLines, margin, yPos);
    yPos += (audienceLines.length * 5) + 4;

    const keywordsText = `Keywords: ${result.keywords.join(", ")}`;
    const kwLines = doc.splitTextToSize(keywordsText, contentWidth);
    checkPageBreak(kwLines.length * 5);
    doc.text(kwLines, margin, yPos);
    yPos += (kwLines.length * 5) + 8;

    // Captions
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text("Generated Captions", margin, yPos);
    yPos += 8;

    result.captions.forEach((cap) => {
      checkPageBreak(60); // Check for space for platform + title + caption
      
      // Platform pill style text
      doc.setFont(undefined, 'bold');
      doc.setFontSize(11);
      doc.setTextColor(14, 165, 233);
      doc.text(`${cap.platform} (${cap.strategy})`, margin, yPos);
      yPos += 6;

      // Title (if present)
      doc.setTextColor(0);
      if (cap.title) {
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        const titleLines = doc.splitTextToSize(cap.title, contentWidth - 5);
        doc.text(titleLines, margin + 2, yPos);
        yPos += (titleLines.length * 5) + 2;
      }

      // Caption text
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      const capLines = doc.splitTextToSize(cap.caption, contentWidth - 5);
      doc.text(capLines, margin + 2, yPos);
      yPos += (capLines.length * 5) + 4;

      // Hashtags
      doc.setFontSize(9);
      doc.setTextColor(100);
      const tagLines = doc.splitTextToSize(cap.hashtags.join(" "), contentWidth - 5);
      doc.text(tagLines, margin + 2, yPos);
      yPos += (tagLines.length * 5) + 8;
    });

    yPos += 5;
  });

  doc.save("brownricebandit-virality-report.pdf");
};