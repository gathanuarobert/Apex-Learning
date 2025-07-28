import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import {jwtDecode} from "jwt-decode";
import DraggableCaptcha from "../components/DraggableCaptcha";

const Register = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState("general");
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    educationLevel: "",
    grade: "",
    childName: "",
    subject: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (
      !formData.email.match(
        /^[\w-.]+@(gmail\.com|yahoo\.com|student\.ku\.ac\.ke)$/
      )
    ) {
      newErrors.email = "Invalid email domain.";
    }
    if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long.";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }
    return newErrors;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
    } else {
      setErrors({});
      setRegistrationSuccess(true);
    }
  };

  const handleCaptchaComplete = () => {
    setCaptchaVerified(true);
  };

  const handleGoogleSuccess = (credentialResponse) => {
    const userData = jwtDecode(credentialResponse.credential);
    console.log("Google user data:", userData);
  };

  const getGrades = () => {
    if (formData.educationLevel === "CBC") {
      return [
        "Pre-primary 1",
        "Pre-primary 2",
        "Grade 1",
        "Grade 2",
        "Grade 3",
        "Grade 4",
        "Grade 5",
        "Grade 6",
        "Grade 7",
        "Grade 8",
        "Grade 9",
        "Grade 10",
        "Grade 11",
        "Grade 12",
      ];
    } else if (formData.educationLevel === "8-4-4") {
      return ["Form 1", "Form 2", "Form 3", "Form 4"];
    } else {
      return [];
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-xl rounded-2xl p-6 w-full max-w-lg space-y-6"
      >
        <h2 className="text-xl font-bold text-center mb-4">Register</h2>

        <div className="flex flex-wrap gap-4 mb-6">
          <label className="w-full font-medium text-base">Select Role:</label>
          {["student", "parent", "teacher", "general"].map((r) => (
            <label
              key={r}
              className="flex items-center gap-2 cursor-pointer text-sm md:text-base"
            >
              <input
                type="radio"
                name="role"
                value={r}
                checked={role === r}
                onChange={() => setRole(r)}
                className="cursor-pointer"
              />
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </label>
          ))}
        </div>

        {role !== "general" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <input
              name="firstName"
              placeholder="First Name"
              onChange={handleChange}
              className="rounded-2xl p-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition w-full"
            />
            <input
              name="middleName"
              placeholder="Middle Name"
              onChange={handleChange}
              className="rounded-2xl p-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition w-full"
            />
            <input
              name="lastName"
              placeholder="Last Name"
              onChange={handleChange}
              className="rounded-2xl p-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition w-full"
            />
          </div>
        )}

        {role === "parent" && (
          <input
            name="childName"
            placeholder="Child's Name (optional)"
            onChange={handleChange}
            className="rounded-2xl p-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition w-full mb-6"
          />
        )}

        <input
          name="email"
          placeholder="Email"
          onChange={handleChange}
          className="rounded-2xl p-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition w-full mb-4"
          autoComplete="email"
        />
        {errors.email && (
          <p className="text-red-600 text-sm mt-1 mb-4">{errors.email}</p>
        )}

        <div className="relative mb-4">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            onChange={handleChange}
            className="rounded-2xl p-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition w-full"
            autoComplete="new-password"
          />
          <span
            className="absolute right-3 top-3 cursor-pointer select-none p-1"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            role="button"
          >
            {showPassword ? "🙈" : "👁️"}
          </span>
        </div>
        {errors.password && (
          <p className="text-red-600 text-sm mt-1 mb-4">{errors.password}</p>
        )}

        <div className="relative mb-4">
          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            placeholder="Confirm Password"
            onChange={handleChange}
            className="rounded-2xl p-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition w-full"
            autoComplete="new-password"
          />
          <span
            className="absolute right-3 top-3 cursor-pointer select-none p-1"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-label={
              showConfirmPassword ? "Hide password" : "Show password"
            }
            role="button"
          >
            {showConfirmPassword ? "🙈" : "👁️"}
          </span>
        </div>
        {errors.confirmPassword && (
          <p className="text-red-600 text-sm mt-1 mb-4">{errors.confirmPassword}</p>
        )}

        {(role === "student" || role === "teacher") && (
          <select
            name="educationLevel"
            onChange={handleChange}
            className="rounded-2xl p-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition w-full mb-4"
            defaultValue=""
          >
            <option value="" disabled>
              Select Education Level
            </option>
            <option value="CBC">CBC</option>
            <option value="8-4-4">8-4-4</option>
          </select>
        )}

        {role === "student" && (
          <select
            name="grade"
            onChange={handleChange}
            className="rounded-2xl p-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition w-full mb-4"
            defaultValue=""
          >
            <option value="" disabled>
              Select Grade
            </option>
            {getGrades().map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>
        )}

        {role === "teacher" && (
          <select
            name="subject"
            onChange={handleChange}
            className="rounded-2xl p-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition w-full mb-4"
            defaultValue=""
          >
            <option value="" disabled>
              Select Subject
            </option>
            <option>Mathematics</option>
            <option>English</option>
            <option>Kiswahili</option>
            <option>Science</option>
            <option>Social Studies</option>
            <option>CRE/IRE/HRE</option>
          </select>
        )}

        {!registrationSuccess && (
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-2xl transition duration-300"
          >
            Register
          </button>
        )}

        {registrationSuccess && !captchaVerified && (
          <div className="mb-6">
            <p className="text-center text-gray-700 mb-3 text-sm md:text-base">
              Registration successful! Please complete CAPTCHA to continue.
            </p>
            <DraggableCaptcha onVerify={handleCaptchaComplete} />
          </div>
        )}

        {captchaVerified && (
          <p className="text-center text-green-700 font-semibold mt-6 text-sm md:text-base">
            Registration complete! You may now{" "}
            <span
              onClick={() => navigate("/login")}
              className="text-blue-600 cursor-pointer underline"
            >
              log in
            </span>
            .
          </p>
        )}

        <div className="text-center mt-6 mb-2 text-sm md:text-base">Or</div>
        <div className="flex justify-center">
          <GoogleLogin onSuccess={handleGoogleSuccess} />
        </div>

        <p className="text-center mt-6 text-sm md:text-base">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-blue-600 cursor-pointer underline"
          >
            Login
          </span>
        </p>
      </form>
    </div>
  );
};

export default Register;
