import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export const generatePDFReport = async (shifts, driverEmail, nameDriver) => {
  const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="color: #b80000;">Luba Delivery</h1>
        <h2 style="color: #b80000;"></h2>
        <p><strong>Driver:</strong> ${nameDriver}</p>
        <p><strong>Email:</strong> ${driverEmail}</p>
        <h2 style="color: #b80000;">Driver Shift Report</h2>
        <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
        <hr/>
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; font-size: 14px;">
          <thead style="background: #f5f5f5;">
            <tr>
              <th>Report Exported Date</th>
              <th>Completed Rides</th>
              <th>Total Earnings (R)</th>
            </tr>
          </thead>
          <tbody>
            ${shifts.map((shift) => {
              const date = new Date(Number(shift.startTime)).toLocaleDateString();
              return `
                <tr>
                  <td>${date}</td>
                  <td>${shift.completedRides || 0}</td>
                  <td>R${(shift.totalEarnings || 0).toFixed(2)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        <br/>
        <p style="font-size: 12px; color: #888;">Luba Delivery — Powered by your hustle 💼</p>
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html: htmlContent });
  await Sharing.shareAsync(uri, {
    UTI: '.pdf',
    mimeType: 'application/pdf',
  });
};
