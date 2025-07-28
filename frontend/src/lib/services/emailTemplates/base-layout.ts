// Base email template layout
export const baseLayout = (content: string, footerContent?: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RevivaTech</title>
    <style>
        /* Reset styles */
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
        
        /* Base styles */
        body {
            width: 100% !important;
            height: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #1D1D1F;
            background-color: #f4f4f7;
        }
        
        /* Container styles */
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        
        /* Header styles */
        .email-header {
            background-color: #007AFF;
            padding: 40px 20px;
            text-align: center;
        }
        
        .email-header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        
        /* Content styles */
        .email-content {
            padding: 40px 20px;
        }
        
        .email-content h2 {
            color: #1D1D1F;
            font-size: 24px;
            margin-bottom: 20px;
            font-weight: 600;
        }
        
        .email-content p {
            color: #4A4A4A;
            font-size: 16px;
            line-height: 24px;
            margin-bottom: 20px;
        }
        
        /* Button styles */
        .button {
            display: inline-block;
            padding: 14px 32px;
            background-color: #007AFF;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
        }
        
        .button-secondary {
            background-color: #E5E5EA;
            color: #1D1D1F !important;
        }
        
        /* Info box styles */
        .info-box {
            background-color: #F9FAFB;
            border: 1px solid #E5E5EA;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .info-box h3 {
            color: #1D1D1F;
            font-size: 18px;
            margin-bottom: 10px;
            font-weight: 600;
        }
        
        .info-box p {
            margin: 5px 0;
            color: #4A4A4A;
        }
        
        /* Table styles */
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        
        .data-table th {
            background-color: #F9FAFB;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            color: #1D1D1F;
            border-bottom: 2px solid #E5E5EA;
        }
        
        .data-table td {
            padding: 12px;
            border-bottom: 1px solid #E5E5EA;
            color: #4A4A4A;
        }
        
        /* Footer styles */
        .email-footer {
            background-color: #F9FAFB;
            padding: 30px 20px;
            text-align: center;
            border-top: 1px solid #E5E5EA;
        }
        
        .email-footer p {
            color: #8E8E93;
            font-size: 14px;
            margin: 5px 0;
        }
        
        .email-footer a {
            color: #007AFF;
            text-decoration: none;
        }
        
        /* Responsive styles */
        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
            }
            
            .email-content {
                padding: 30px 15px;
            }
            
            .button {
                display: block;
                width: 100%;
                box-sizing: border-box;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>RevivaTech</h1>
        </div>
        
        <div class="email-content">
            ${content}
        </div>
        
        <div class="email-footer">
            ${footerContent || `
                <p>Thank you for choosing RevivaTech</p>
                <p>Professional Computer Repair Services</p>
                <p>
                    <a href="https://revivatech.co.uk">revivatech.co.uk</a> | 
                    <a href="tel:+44123456789">+44 123 456 789</a>
                </p>
                <p style="margin-top: 20px; font-size: 12px; color: #C7C7CC;">
                    © ${new Date().getFullYear()} RevivaTech. All rights reserved.
                </p>
            `}
        </div>
    </div>
</body>
</html>
`;