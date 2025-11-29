import { VideoFile } from "../types";

export const generateDOCX = async (videos: VideoFile[]) => {
  // Dynamic import to avoid heavy initial load
  const docx = await import("docx");
  const fileSaverModule = await import("file-saver");
  
  // Handle ESM default export behavior for file-saver
  // @ts-ignore
  const saveAs = fileSaverModule.default || fileSaverModule.saveAs;

  if (typeof saveAs !== 'function') {
    console.error("file-saver saveAs is not a function", fileSaverModule);
    alert("Export failed: Could not load file saving utility.");
    return;
  }

  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = docx;

  const completedVideos = videos.filter(v => v.status === 'complete' && v.analysis);

  if (completedVideos.length === 0) {
    alert("No completed analyses to export.");
    return;
  }

  const sections = [];

  // Title Section
  const children = [
    new Paragraph({
      text: "Brownricebandit Virality Report",
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    }),
    new Paragraph({
      text: `Generated on ${new Date().toLocaleDateString()}`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 500 },
    }),
  ];

  completedVideos.forEach((video, index) => {
    const result = video.analysis!;

    // Video Separator
    children.push(
      new Paragraph({
        text: `Video ${index + 1}: ${video.file.name}`,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
        border: {
          bottom: {
            color: "E2E8F0",
            space: 1,
            value: BorderStyle.SINGLE,
            size: 6,
          },
        },
      })
    );

    // Summary
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "Summary", bold: true, size: 24 })],
        spacing: { after: 100 },
      }),
      new Paragraph({
        text: result.transcriptSummary,
        spacing: { after: 300 },
      })
    );

    // Audience
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "Target Audience", bold: true, size: 24 })],
        spacing: { after: 100 },
      }),
      new Paragraph({
        text: result.audienceAnalysis,
        spacing: { after: 300 },
      })
    );

    // Keywords
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "Keywords", bold: true, size: 24 })],
        spacing: { after: 100 },
      }),
      new Paragraph({
        text: result.keywords.join(", "),
        spacing: { after: 300 },
      })
    );

    // Captions Header
    children.push(
      new Paragraph({
        text: "Generated Captions",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 200 },
      })
    );

    // Captions List
    result.captions.forEach((cap) => {
      // Platform Header
      children.push(
        new Paragraph({
          children: [
            new TextRun({ 
              text: `${cap.platform} (${cap.strategy})`, 
              bold: true, 
              color: "0EA5E9" 
            }),
          ],
          spacing: { after: 100, before: 100 },
        })
      );

      // Title (if present)
      if (cap.title) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ 
                text: cap.title, 
                bold: true, 
                size: 28 
              }),
            ],
            spacing: { after: 100 },
          })
        );
      }

      // Caption and Hashtags
      children.push(
        new Paragraph({
          text: cap.caption,
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
             new TextRun({ text: cap.hashtags.join(" "), color: "64748B", italics: true })
          ],
          spacing: { after: 300 },
        })
      );
    });

    // Add a page break after each video except the last one
    if (index < completedVideos.length - 1) {
       children.push(new Paragraph({ text: "", pageBreakBefore: true }));
    }
  });

  const doc = new Document({
    sections: [{
      properties: {},
      children: children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, "brownricebandit-virality-report.docx");
};