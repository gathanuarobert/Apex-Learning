import React from "react";
import ReCAPTCHA from "react-google-recaptcha";

const Captcha = ({ onVerify }) => {
  const handleChange = (token) => {
    if (token) {
      // token returned by Google
      console.log("✅ reCAPTCHA token:", token);
      if (onVerify) onVerify(token);
    }
  };

  return (
    <div className="flex justify-center">
      <ReCAPTCHA
        sitekey="6LfeDb8rAAAAAIf7dU9atnxmytVGNjYCmzzTTIcj"   // replace with the real site key from Google console
        onChange={handleChange}
      />
    </div>
  );
};

export default Captcha;
