import nodemailer from 'nodemailer';

const sendEmail = async (options) =>{
    // 1) Create a transporter
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    // 2) Define the email options
    let mailOptions = {
        from: 'Vivek Kumar <vivek3553.vk@gmail.com>', // Sender name & address
        to: options.email, // List of recipients
        subject: options.subject, // Subject line
        text: options.message, // Plain text body
        html: '<b>This is a test email sent from Node.js.</b>' // HTML body
    };
    
    // 3) Actually send the email
    try {
        const info = await transporter.sendMail(mailOptions);    
        console.log('Email sent: ', info.response);
    } catch (error) {
        console.error('Error occurred:', error);
    }   
}

export default sendEmail;