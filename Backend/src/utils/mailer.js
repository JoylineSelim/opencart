import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth:{
        user:process.env.EMAIL_USER,
        pass:process.env.EMAIL_PASS,

    }
})

export const sendEmail = async ({to , subject ,html}) =>{
    const mailOptions = {
        from : `"OpenCart Support" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html
    }

    await transporter.sendMail(mailOptions)
}