import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { loginUser } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";

import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!formData.email || !formData.password) {
      setError(
        "Please enter your email address and password."
      );
      return;
    }

    try {
      setLoading(true);

      const data = await loginUser(
        formData.email,
        formData.password
      );

      login(data);

      navigate("/companies");
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Login failed. Please check your credentials and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      <div className="login-container">

        {/* ==================================================
            LEFT SIDE
        ================================================== */}

        <section className="login-brand-section">

          {/* TOP DECORATION */}

          <div className="brand-circle-decoration"></div>


          {/* BUILDING IMAGE */}

          <div className="login-building">

            <img
              src="/midbrains-building.png"
              alt="Midbrains Technologies Building"
            />

          </div>


          {/* BUILDING IMAGE FADE */}

          <div className="building-fade"></div>


          {/* GOLD CURVE */}

          <div className="gold-curve"></div>


          {/* NAVY BOTTOM CURVE */}

          <div className="navy-curve"></div>


          {/* ==================================================
              BRAND CONTENT
          ================================================== */}

          <div className="login-brand-content">

            {/* LOGO */}

            <div className="login-brand-logo">

              <img
                src="/midbrains-logo.png"
                alt="Midbrains Technologies"
              />

            </div>


            {/* CRM BADGE */}

            <div className="crm-badge">

              <i className="bi bi-briefcase-fill"></i>

              <span>
                Follow-up CRM
              </span>

            </div>


            {/* HEADING */}

            <h1>
              Manage Leads,
              <span>
                Build Relationships
              </span>
            </h1>


            {/* DESCRIPTION */}

            <p className="brand-description">
              A centralized platform to manage leads,
              follow-ups, admissions and business
              activities across your organization.
            </p>


            {/* ==================================================
                FEATURES
            ================================================== */}

            <div className="login-features">

              <div className="login-feature">

                <div className="feature-icon">
                  <i className="bi bi-people-fill"></i>
                </div>

                <div className="feature-content">

                  <strong>
                    Lead Management
                  </strong>

                  <span>
                    Capture and track leads efficiently
                  </span>

                </div>

              </div>


              <div className="login-feature">

                <div className="feature-icon">
                  <i className="bi bi-calendar-check-fill"></i>
                </div>

                <div className="feature-content">

                  <strong>
                    Follow-up Tracking
                  </strong>

                  <span>
                    Never miss an important follow-up
                  </span>

                </div>

              </div>


              <div className="login-feature">

                <div className="feature-icon">
                  <i className="bi bi-bar-chart-fill"></i>
                </div>

                <div className="feature-content">

                  <strong>
                    Reports & Analytics
                  </strong>

                  <span>
                    Get meaningful business insights
                  </span>

                </div>

              </div>


              <div className="login-feature">

                <div className="feature-icon">
                  <i className="bi bi-buildings-fill"></i>
                </div>

                <div className="feature-content">

                  <strong>
                    Centralized Management
                  </strong>

                  <span>
                    Manage your business operations in one place
                  </span>

                </div>

              </div>

            </div>

          </div>


          {/* ==================================================
              BOTTOM FOOTER
          ================================================== */}

          <div className="brand-footer">

            <span>
              <i className="bi bi-shield-check"></i>
              Secure Business Management
            </span>

            <span>
              <i className="bi bi-shield-lock"></i>
              Protected Access
            </span>

          </div>

        </section>


        {/* ==================================================
            RIGHT LOGIN
        ================================================== */}

        <section className="login-form-section">

          {/* TOP RIGHT CIRCLE */}

          <div className="form-circle-top"></div>


          {/* BOTTOM RIGHT CIRCLE */}

          <div className="form-circle-bottom"></div>


          <div className="login-form-wrapper">

            {/* MOBILE LOGO */}

            <div className="mobile-logo">

              <img
                src="/midbrains-logo.png"
                alt="Midbrains Technologies"
              />

            </div>


            {/* HEADER */}

            <div className="login-form-header">

              <span className="welcome-text">
                Welcome back
              </span>

              <h2>
                Sign in to your account
              </h2>

              <p>
                Enter your credentials to access
                the Follow-up CRM dashboard.
              </p>

            </div>


            {/* ERROR */}

            {error && (
              <div className="login-error">

                <i className="bi bi-exclamation-circle-fill"></i>

                <div>

                  <strong>
                    Login unsuccessful
                  </strong>

                  <span>
                    {error}
                  </span>

                </div>

              </div>
            )}


            {/* ==================================================
                FORM
            ================================================== */}

            <form
              className="login-form"
              onSubmit={handleSubmit}
            >

              {/* EMAIL */}

              <div className="form-field">

                <label htmlFor="email">
                  Email Address
                </label>

                <div className="input-wrapper">

                  <i className="bi bi-envelope input-icon"></i>

                  <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                    disabled={loading}
                  />

                </div>

              </div>


              {/* PASSWORD */}

              <div className="form-field">

                <label htmlFor="password">
                  Password
                </label>

                <div className="input-wrapper">

                  <i className="bi bi-lock input-icon"></i>

                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                    disabled={loading}
                  />

                  <button
                    type="button"
                    className="password-button"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >

                    <i
                      className={`bi ${
                        showPassword
                          ? "bi-eye-slash"
                          : "bi-eye"
                      }`}
                    ></i>

                  </button>

                </div>

              </div>


              {/* LOGIN BUTTON */}

              <button
                type="submit"
                className="login-button"
                disabled={loading}
              >

                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm"></span>

                    <span>
                      Signing in...
                    </span>
                  </>
                ) : (
                  <>
                    <span>
                      Sign In
                    </span>

                    <i className="bi bi-arrow-right"></i>
                  </>
                )}

              </button>

            </form>


            {/* SECURITY */}

            <div className="security-message">

              <i className="bi bi-shield-fill-check"></i>

              <span>
                Your connection and account information
                are securely protected.
              </span>

            </div>


            {/* COPYRIGHT */}

            <div className="copyright">
              © {new Date().getFullYear()} Midbrains Technologies
            </div>

          </div>

        </section>

      </div>

    </div>
  );
};

export default Login;