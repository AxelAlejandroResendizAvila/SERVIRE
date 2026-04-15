import twilio from 'twilio';

const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || '+17409210911';

const client = twilio(accountSid, authToken);

/**
 * Genera un código aleatorio de 6 dígitos
 */
export const generateResetCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Envía un código de reset por WhatsApp
 */
export const sendWhatsAppCode = async (phoneNumber, code) => {
  try {
    // Formato: +52XXXXXXXXXX (México)
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+52${phoneNumber}`;

    const message = await client.messages.create({
      from: `whatsapp:${twilioPhoneNumber}`,
      to: `whatsapp:${formattedPhone}`,
      body: `Tu código de recuperación de contraseña es: ${code}\n\nEste código expirará en 15 minutos.`,
    });

    return {
      success: true,
      messageSid: message.sid,
    };
  } catch (error) {
    console.error('Error enviando WhatsApp:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Envía un código de reset por SMS (fallback)
 */
export const sendSmsCode = async (phoneNumber, code) => {
  try {
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+52${phoneNumber}`;

    const message = await client.messages.create({
      from: twilioPhoneNumber,
      to: formattedPhone,
      body: `Tu código de recuperación de contraseña es: ${code}\n\nEste código expirará en 15 minutos.`,
    });

    return {
      success: true,
      messageSid: message.sid,
    };
  } catch (error) {
    console.error('Error enviando SMS:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};
