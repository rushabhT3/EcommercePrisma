const bcrypt = require("bcrypt");
const SibApiV3Sdk = require("@getbrevo/brevo");
var jwt = require("jsonwebtoken");

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const saltRounds = 10;
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
const apiKey = apiInstance.authentications["apiKey"];
apiKey.apiKey = process.env.BREVO_API_KEY;

function generateVerificationCode() {
  return Math.floor(10000000 + Math.random() * 90000000);
}

const sendEmail = async (email, verificationCode) => {
  try {
    let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    // Define your email parameters
    sendSmtpEmail.sender = {
      name: "John Doe Robot",
      email: "ecommerce@turnover.com",
    };
    sendSmtpEmail.to = [{ email: email }];
    sendSmtpEmail.subject = "Verification Code";
    sendSmtpEmail.htmlContent = `Your verification code is: <strong style="font-size: 1.5em;">${verificationCode}</strong>. Please copy this code and paste it into the verification form.`;

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(
      "API called successfully. Returned data: " + JSON.stringify(data)
    );
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
};

// Backend
const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const verificationCode = generateVerificationCode();

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        verificationCode,
      },
    });

    await sendEmail(newUser.email, verificationCode);

    res.status(201).json({ message: `Signup successful for ${newUser.name} with email ${newUser.email}!` });
  } catch (err) {
    console.error(err);
    let message = "An error occurred during signup.";
    if (err instanceof prisma.PrismaClientKnownRequestError) {
      message = err.message;
    }
    res.status(500).json({ message });
  }
};

const verify = async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res
        .status(401)
        .json({ message: "Invalid email.", verified: false });
    }

    if (user.verified) {
      return res
        .status(200)
        .json({ message: "User already verified.", verified: true });
    }

    if (user.verificationCode !== parseInt(code)) {
      return res
        .status(401)
        .json({ message: "Invalid code.", verified: false });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { verified: true },
    });

    res
      .status(200)
      .json({ message: "Verification successful!", verified: true });
  } catch (err) {
    res
      .status(500)
      .json({
        message: "An error occurred during verification.",
        verified: false,
      });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by email
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).send("Invalid email or password.");
    }

    // Check the password
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).send("Invalid email or password.");
    }

    console.log({ user });

    // Generate a JWT
    const token = jwt.sign({ id: user.id }, "jwt_secret_key", {
      expiresIn: "1h",
    });

    res.status(200).send({ message: "Login successful!", token });
  } catch (err) {
    res.status(500).send("An error occurred during login.");
  }
};

module.exports = { signup, login, verify };
