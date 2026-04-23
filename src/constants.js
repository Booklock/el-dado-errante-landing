export const WHATSAPP_PHONE = "50687717880";
export const openWhatsApp = (message) => {
  window.open('https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}', "_blank");
    };