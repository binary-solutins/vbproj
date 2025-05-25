/**
 * Generates HTML content for breast screening report
 */
export const generateReportHtml = (capturedImages, doctor, patient) => {
    return `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #DB2777; text-align: center; }
            .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .info-section { margin-bottom: 20px; }
            .info-item { margin-bottom: 10px; }
            .label { font-weight: bold; }
            .images-grid { display: flex; flex-wrap: wrap; justify-content: space-between; }
            .image-container { width: 45%; margin-bottom: 20px; }
            .image { width: 100%; height: auto; border: 1px solid #ccc; }
            .image-caption { text-align: center; margin-top: 5px; font-style: italic; }
          </style>
        </head>
        <body>
          <h1>Breast Screening Report</h1>
          
          <div class="info-section">
            <div class="info-item">
              <span class="label">Date:</span> ${new Date().toLocaleDateString()}
            </div>
            <div class="info-item">
              <span class="label">Doctor:</span> ${doctor?.name || 'N/A'} (${doctor?.specialization || 'N/A'})
            </div>
            <div class="info-item">
              <span class="label">Patient:</span> ${patient?.firstName || 'N/A'} ${patient?.lastName || ''}, ${patient?.age || 'N/A'} years
            </div>
          </div>
          
          <div class="images-grid">
            ${Object.entries(capturedImages).map(([key, image]) => `
              <div class="image-container">
                <img src="file://${image.uri}" class="image" />
                <div class="image-caption">${image.side.charAt(0).toUpperCase() + image.side.slice(1)} Breast - ${image.position.charAt(0).toUpperCase() + image.position.slice(1)}</div>
              </div>
            `).join('')}
          </div>
        </body>
      </html>
    `;
  };
  
  /**
   * Formats a date object as YYYY-MM-DD
   */
  export const formatDate = (date) => {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
  
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
  
    return [year, month, day].join('-');
  };