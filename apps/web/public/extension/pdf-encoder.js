// BeyondTheAI - Minimal Pure-JS Client-Side PDF Generator for Images
// Wraps JPEG image bytes in a valid single-page PDF 1.4 document without external dependencies.

export async function imageBlobToPdf(imageBlob, width, height) {
  // If the blob is not JPEG, convert it to JPEG via canvas first so it can be streamed via DCTDecode
  let jpegBlob = imageBlob;
  if (imageBlob.type !== 'image/jpeg') {
    jpegBlob = await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || width;
        canvas.height = img.naturalHeight || height;
        const ctx = canvas.getContext('2d');
        // Fill white background for transparent images
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92);
      };
      img.src = URL.createObjectURL(imageBlob);
    });
  }

  const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
  const imgWidth = width || 800;
  const imgHeight = height || 600;

  // Build PDF 1.4 objects
  const header = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';

  // Object 1: Catalog
  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';

  // Object 2: Pages
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';

  // Object 3: Page (sized to image dimensions)
  const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${imgWidth} ${imgHeight}] /Resources << /XObject << /Im1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`;

  // Object 4: Image XObject
  const obj4Head = `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgWidth} /Height ${imgHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`;
  const obj4Foot = '\nendstream\nendobj\n';

  // Object 5: Content stream (draw image full size on page)
  const streamContent = `q\n${imgWidth} 0 0 ${imgHeight} 0 0 cm\n/Im1 Do\nQ\n`;
  const obj5 = `5 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}endstream\nendobj\n`;

  const enc = new TextEncoder();
  const bHeader = enc.encode(header);
  const bObj1 = enc.encode(obj1);
  const bObj2 = enc.encode(obj2);
  const bObj3 = enc.encode(obj3);
  const bObj4Head = enc.encode(obj4Head);
  const bObj4Foot = enc.encode(obj4Foot);
  const bObj5 = enc.encode(obj5);

  const offsets = [
    0,
    bHeader.length,
    bHeader.length + bObj1.length,
    bHeader.length + bObj1.length + bObj2.length,
    bHeader.length + bObj1.length + bObj2.length + bObj3.length,
    bHeader.length + bObj1.length + bObj2.length + bObj3.length + bObj4Head.length + jpegBytes.length + bObj4Foot.length
  ];

  const xrefOffset = offsets[5] + bObj5.length;
  let xref = `xref\n0 6\n0000000000 65535 f \n`;
  for (let i = 1; i <= 5; i++) {
    xref += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  }

  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  const bXref = enc.encode(xref);
  const bTrailer = enc.encode(trailer);

  const totalLength = xrefOffset + bXref.length + bTrailer.length;
  const pdfBuffer = new Uint8Array(totalLength);

  let cur = 0;
  pdfBuffer.set(bHeader, cur); cur += bHeader.length;
  pdfBuffer.set(bObj1, cur); cur += bObj1.length;
  pdfBuffer.set(bObj2, cur); cur += bObj2.length;
  pdfBuffer.set(bObj3, cur); cur += bObj3.length;
  pdfBuffer.set(bObj4Head, cur); cur += bObj4Head.length;
  pdfBuffer.set(jpegBytes, cur); cur += jpegBytes.length;
  pdfBuffer.set(bObj4Foot, cur); cur += bObj4Foot.length;
  pdfBuffer.set(bObj5, cur); cur += bObj5.length;
  pdfBuffer.set(bXref, cur); cur += bXref.length;
  pdfBuffer.set(bTrailer, cur);

  return new Blob([pdfBuffer], { type: 'application/pdf' });
}
